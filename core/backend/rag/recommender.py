import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from llm.models import execute_with_llm
from llm.prompts import RECOMMENDATION_QUERY_PROMPT
from database.json_db import projects_db

def get_recommendations(project_id: str):
    if project_id not in projects_db:
        return {"status": "error", "message": "Project not found"}
        
    project = projects_db[project_id]
    papers = project.get("papers", [])
    
    if not papers:
        return {"status": "error", "message": "No papers in project to base recommendations on."}
        
    context_str = ""
    for p in papers:
        context_str += f"Title: {p.get('filename')}\nSummary: {p.get('summary', 'N/A')}\n\n"
        
    # Generate query
    response = execute_with_llm(RECOMMENDATION_QUERY_PROMPT, {"context": context_str})
    query = response.content.strip()
    
    if not query:
        return {"status": "error", "message": "Failed to generate search query"}
        
    print(f"Generated ArXiv Query: {query}")
    
    # Hit ArXiv API
    url = f"http://export.arxiv.org/api/query?search_query=all:{urllib.parse.quote(query)}&start=0&max_results=5"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        namespace = {'atom': 'http://www.w3.org/2005/Atom'}
        
        recommendations = []
        for entry in root.findall('atom:entry', namespace):
            title = entry.find('atom:title', namespace).text
            title = " ".join(title.split()) # clean newlines
            
            summary = entry.find('atom:summary', namespace).text
            summary = " ".join(summary.split())
            
            link = entry.find('atom:id', namespace).text
            
            authors = [author.find('atom:name', namespace).text for author in entry.findall('atom:author', namespace)]
            
            recommendations.append({
                "title": title,
                "summary": summary,
                "link": link,
                "authors": authors
            })
            
        return {"status": "success", "query": query, "recommendations": recommendations}
        
    except Exception as e:
        print(f"Error querying ArXiv: {e}")
        return {"status": "error", "message": str(e)}
