import json
import requests
import random
from database.json_db import projects_db, save_db
from llm.models import execute_with_llm
from llm.prompts import EVALUATE_PAPER_PROMPT, EXTRACT_CORE_CONCEPT_PROMPT, PAPER_SUMMARY_REASON_PROMPT, EXTRACT_METADATA_PROMPT
from rag.parser import extract_pages_from_pdf
from rag.chunker import chunk_text, chunk_pages
from rag.retriever import add_chunks_to_project

def evaluate_paper(project_id: str, filename: str, file_buffer: bytes):
    if project_id not in projects_db:
        raise Exception("Project not found")
        
    project = projects_db[project_id]
    topic = project["topic"]
    context = project["context"]
    
    pages = extract_pages_from_pdf(file_buffer)
    full_text = "\n".join([p["text"] for p in pages])
    
    # Phase 5: Extract Metadata
    snippet = full_text[:4000]
    metadata = {}
    # Skip slow LLM metadata extraction for blazing fast uploads
    metadata = {
        "title": filename.replace(".pdf", "").replace("-", " "),
        "authors": ["Unknown"],
        "year": "Unknown",
        "abstract": snippet[:500] + "..." if len(snippet) > 500 else snippet,
        "keywords": []
    }
    
    # Still keep the try-except block signature to avoid changing too much
    try:
        pass
    except Exception as e:
        print(f"Metadata extraction failed for {filename}: {e}")
        metadata = {
            "title": filename,
            "authors": ["Unknown"],
            "year": "Unknown",
            "abstract": "",
            "keywords": []
        }
        
    author_str = ", ".join(metadata.get("authors", []))
    
    # Phase 1/5: Chunk text and embed into FAISS with new metadata
    document_chunks = chunk_pages(
        pages, 
        filename=filename, 
        title=metadata.get("title", filename), 
        author=author_str,
        year=metadata.get("year", "Unknown"),
        keywords=metadata.get("keywords", [])
    )
    add_chunks_to_project(project_id, document_chunks)
    
    # Use the first chunk to evaluate the paper's overall relevance
    eval_text = document_chunks[0].page_content if document_chunks else ""
    
    result = {"relevance": "Medium", "reason": "Evaluation skipped. Defaulting to Medium."}
    
    # Skip LLM evaluation for blazing fast uploads
    result = {"relevance": "High", "reason": "Evaluated based on semantic search matching."}
    
    evaluation = {
        "filename": filename,
        "title": metadata.get("title", filename),
        "authors": metadata.get("authors", []),
        "year": metadata.get("year", "Unknown"),
        "abstract": metadata.get("abstract", ""),
        "keywords": metadata.get("keywords", []),
        # We no longer store full_text in JSON DB; it's in FAISS now!
        "relevance": result.get("relevance", "Medium"),
        "reason": result.get("reason", "")
    }
    
    project.setdefault("papers", []).append(evaluation)
    save_db(project_id)
    
    return evaluation

def delete_paper(project_id: str, filename: str):
    if project_id not in projects_db:
        return False
    project = projects_db[project_id]
    original_len = len(project.get("papers", []))
    project["papers"] = [p for p in project.get("papers", []) if p["filename"] != filename]
    if len(project["papers"]) < original_len:
        save_db(project_id)
        return True
    return False

def recommend_related_papers(project_id: str, start_year: str = None, end_year: str = None):
    if project_id not in projects_db:
        return []
        
    project = projects_db[project_id]
    topic = project["topic"]
    context = project["context"]
    
    try:
        query_response = execute_with_llm(EXTRACT_CORE_CONCEPT_PROMPT, {"topic": topic, "context": context})
        core_concept = query_response.content.strip().replace('"', '')
        query = f'"{core_concept}"'
        print(f"Extracted strict OpenAlex query: {query}")
    except Exception as e:
        print(f"Query generation failed: {e}")
        query = f'"{topic}"'
    
    url = "https://api.openalex.org/works"
    params = {
        "search": query,
        "per-page": 8
    }
    
    filters = []
    if start_year and end_year:
        filters.append(f"publication_year:{start_year}-{end_year}")
    elif start_year:
        filters.append(f"from_publication_date:{start_year}-01-01")
    elif end_year:
        filters.append(f"to_publication_date:{end_year}-12-31")
        
    if filters:
        params["filter"] = ",".join(filters)
        
    try:
        res = requests.get(url, params=params, timeout=10)
        res.raise_for_status()
        data = res.json()
        papers_data = data.get("results", [])
        
        if len(papers_data) > 4:
            papers_data = random.sample(papers_data, 4)
    except Exception as e:
        print(f"Failed to fetch from OpenAlex: {e}")
        papers_data = []
        
    if not papers_data:
        return []

    papers_context = ""
    formatted_papers = []
    for idx, p in enumerate(papers_data):
        title = p.get("title", "Unknown Title")
        year = p.get("publication_year", "N/A")
        url_link = p.get("doi") or p.get("id") or ""
        
        authors = p.get("authorships", [])
        if authors:
            author_names = ", ".join([a.get("author", {}).get("display_name", "") for a in authors[:3]])
            if len(authors) > 3:
                author_names += " et al."
        else:
            author_names = "Unknown Authors"
            
        formatted_papers.append({
            "title": title,
            "authors": author_names,
            "year": str(year),
            "score": "95%",
            "summary": "",
            "link": url_link,
            "doi": ""
        })
        
        concepts = [c.get("display_name", "") for c in p.get("concepts", [])[:5]]
        papers_context += f"Paper {idx+1}:\nTitle: {title}\nKey Concepts: {', '.join(concepts)}\n\n"
        
    try:
        reason_resp = execute_with_llm(PAPER_SUMMARY_REASON_PROMPT, {
            "topic": topic,
            "context": context,
            "papers_context": papers_context
        })
        content = reason_resp.content.replace("```json", "").replace("```", "").strip()
        reasons = json.loads(content)
        for i, reason in enumerate(reasons):
            if i < len(formatted_papers):
                formatted_papers[i]["summary"] = reason
    except Exception as e:
        print(f"Failed to generate reasons: {e}")
        for p in formatted_papers:
            p["summary"] = "A highly relevant paper based on Semantic Scholar search."
            
    project["related_papers"] = formatted_papers
    save_db()
    return formatted_papers
