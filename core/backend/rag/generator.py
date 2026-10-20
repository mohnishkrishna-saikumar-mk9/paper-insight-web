import json
from llm.models import execute_with_llm
from llm.prompts import QUERY_PROJECT_PROMPT, MULTI_QUERY_PROMPT, PAPER_TARGET_EXTRACTION_PROMPT, MULTI_PAPER_COMPARE_PROMPT, GAP_DETECTION_PROMPT, LIT_REVIEW_MAP_PROMPT, LIT_REVIEW_REDUCE_PROMPT, GRAPH_EXTRACTION_PROMPT
from database.json_db import projects_db, save_db

from rag.retriever import search_project_chunks

def get_project_papers(project):
    papers = project.get("papers", [])
    return [p["filename"] for p in papers]

def query_project(project_id: str, message: str):
    if project_id not in projects_db:
        return "Project not found. Please create a project first."
        
    project = projects_db[project_id]
    topic = project["topic"]
    project_context = project.get("context", "")
    
    # Instantly save the user's message so it is not lost if the process fails or takes a long time
    project.setdefault("chat_history", []).append({"role": "user", "content": message})
    save_db(project_id)
    
    # Phase 7: Intent & Entity Extraction (Skipped for speed - Quick Reply)
    available_papers = get_project_papers(project)
    available_papers_str = "\n".join([f"- {p}" for p in available_papers]) if available_papers else "None"
    
    target_papers = []
    # if available_papers:
    #     try:
    #         target_response = execute_with_llm(PAPER_TARGET_EXTRACTION_PROMPT, {"available_papers": available_papers_str, "question": message})
    #         target_text = target_response.content.strip()
    #         if target_text.startswith("```json"):
    #             target_text = target_text[7:-3].strip()
    #         elif target_text.startswith("```"):
    #             target_text = target_text[3:-3].strip()
    #             
    #         parsed_targets = json.loads(target_text)
    #         if isinstance(parsed_targets, list):
    #             target_papers = [p for p in parsed_targets if p in available_papers]
    #     except Exception as e:
    #         print(f"Failed to extract paper targets: {e}")
    #         target_papers = []

    # Phase 4: Generate alternative sub-queries (Skipped for speed - Quick Reply)
    queries = [message]
        
    unique_chunks = {}
    
    if target_papers:
        # Phase 7: Multi-Paper RAG - Balanced Retrieval
        print(f"Executing Targeted Retrieval for: {target_papers}")
        for target in target_papers:
            for q in queries[:2]: # Reduce to 2 queries per paper to manage token limits
                retrieved = search_project_chunks(project_id, q, top_k=3, filter_filename=target)
                for chunk in retrieved:
                    chunk_id = chunk.metadata.get("chunk_id", chunk.page_content[:50])
                    if chunk_id not in unique_chunks:
                        unique_chunks[chunk_id] = chunk
    else:
        # Phase 4: Default Retrieval across entire project
        for q in queries[:4]:
            retrieved = search_project_chunks(project_id, q, top_k=3)
            for chunk in retrieved:
                chunk_id = chunk.metadata.get("chunk_id", chunk.page_content[:50])
                if chunk_id not in unique_chunks:
                    unique_chunks[chunk_id] = chunk
                
    retrieved_chunks = list(unique_chunks.values())
    
    # Build context string
    context_str = f"Project Base Context from User:\n{project_context}\n\n"
    
    if retrieved_chunks:
        if target_papers:
            context_str += "Excerpts Segregated by Paper:\n"
            for target in target_papers:
                target_chunks = [c for c in retrieved_chunks if c.metadata.get("filename") == target]
                if target_chunks:
                    context_str += f"\n=== PAPER: {target} ===\n"
                    for i, chunk in enumerate(target_chunks):
                        section = chunk.metadata.get("section", "")
                        page = chunk.metadata.get("page", "?")
                        section_str = f", Section: {section}" if section else ""
                        context_str += f"--- Excerpt {i+1} (Page: {page}{section_str}) ---\n"
                        context_str += chunk.page_content + "\n\n"
        else:
            context_str += "Excerpts from Uploaded Papers:\n"
            for i, chunk in enumerate(retrieved_chunks):
                filename = chunk.metadata.get("filename", "Unknown Paper")
                section = chunk.metadata.get("section", "")
                page = chunk.metadata.get("page", "?")
                section_str = f", Section: {section}" if section else ""
                context_str += f"--- Excerpt {i+1} from: {filename} (Page: {page}{section_str}) ---\n"
                context_str += chunk.page_content + "\n\n"
    else:
        context_str += "(No highly relevant research papers have been uploaded or matched yet.)\n"
        
    prompt_to_use = MULTI_PAPER_COMPARE_PROMPT if target_papers else QUERY_PROJECT_PROMPT
    response = execute_with_llm(prompt_to_use, {"topic": topic, "context": context_str, "question": message})
    
    output_text = response.content.strip()
    if output_text.startswith("```json"):
        output_text = output_text[7:-3].strip()
    elif output_text.startswith("```"):
        output_text = output_text[3:-3].strip()
        
    try:
        parsed = json.loads(output_text)
        answer = parsed.get("answer", output_text)
        confidence = parsed.get("confidence", "Unknown")
        
        # Calculate which papers were actually used/retrieved to form the context
        used_papers = set()
        if target_papers:
            used_papers = set(target_papers)
        else:
            for chunk in retrieved_chunks:
                filename = chunk.metadata.get("filename", "Unknown Paper")
                if filename != "Unknown Paper":
                    used_papers.add(filename)
                    
        used_papers_str = "\n".join([f"- {p}" for p in used_papers]) if used_papers else "None"
        
        final_content = f"{answer}\n\n---\n**Confidence Score:** {confidence}\n\n**Sources Preferred:**\n{used_papers_str}"
    except Exception as e:
        print(f"Failed to parse confidence JSON: {e}")
        final_content = output_text
    
    project["chat_history"].append({"role": "ai", "content": final_content})
    save_db(project_id)
    
    return final_content

def generate_research_gaps(project_id: str):
    if project_id not in projects_db:
        raise Exception("Project not found.")
        
    project = projects_db[project_id]
    topic = project["topic"]
    
    probes = [
        "limitations of current methodology",
        "future work and proposed extensions",
        "unsolved problems and drawbacks"
    ]
    
    unique_chunks = {}
    for probe in probes:
        retrieved = search_project_chunks(project_id, probe, top_k=5)
        for chunk in retrieved:
            chunk_id = chunk.metadata.get("chunk_id", chunk.page_content[:50])
            if chunk_id not in unique_chunks:
                unique_chunks[chunk_id] = chunk
                
    retrieved_chunks = list(unique_chunks.values())
    
    if not retrieved_chunks:
        return []
        
    context_str = "Excerpts from Uploaded Papers:\n"
    for i, chunk in enumerate(retrieved_chunks):
        filename = chunk.metadata.get("filename", "Unknown Paper")
        context_str += f"--- Excerpt {i+1} from: {filename} ---\n"
        context_str += chunk.page_content + "\n\n"
        
    response = execute_with_llm(GAP_DETECTION_PROMPT, {"topic": topic, "context": context_str})
    
    output_text = response.content.strip()
    if output_text.startswith("```json"):
        output_text = output_text[7:-3].strip()
    elif output_text.startswith("```"):
        output_text = output_text[3:-3].strip()
        
    try:
        gaps = json.loads(output_text)
        return gaps
    except Exception as e:
        print(f"Failed to parse gaps JSON: {e}")
        return []

def generate_literature_review(project_id: str):
    if project_id not in projects_db:
        raise Exception("Project not found.")
        
    project = projects_db[project_id]
    topic = project["topic"]
    papers = project.get("papers", [])
    
    if not papers:
        return "No papers uploaded to generate a literature review."
        
    # Step 1: Chronological Sorting
    def parse_year(year_str):
        import re
        match = re.search(r'\d{4}', str(year_str))
        return int(match.group()) if match else 9999
        
    sorted_papers = sorted(papers, key=lambda x: parse_year(x.get('year', '9999')))
    
    # Step 2: Map Phase (Batch Summarization)
    batch_size = 3
    batches = [sorted_papers[i:i + batch_size] for i in range(0, len(sorted_papers), batch_size)]
    
    sub_sections = []
    
    for batch_idx, batch in enumerate(batches):
        context_str = ""
        for paper in batch:
            filename = paper["filename"]
            probe = "main findings, methodology, and core contributions"
            retrieved = search_project_chunks(project_id, probe, top_k=5, filter_filename=filename)
            
            if retrieved:
                context_str += f"=== Paper: {filename} ===\n"
                for chunk in retrieved:
                    context_str += chunk.page_content + "\n\n"
                    
        if not context_str:
            continue
            
        print(f"Executing Map Phase for batch {batch_idx + 1}/{len(batches)}...")
        map_response = execute_with_llm(LIT_REVIEW_MAP_PROMPT, {
            "topic": topic,
            "num_papers": len(batch),
            "context": context_str
        })
        sub_sections.append(map_response.content.strip())
        
    if not sub_sections:
        return "Could not extract sufficient information to write a review."
        
    # Step 3: Reduce Phase (Stitching)
    print("Executing Reduce Phase (Stitching)...")
    reduce_context = ""
    for i, sub in enumerate(sub_sections):
        reduce_context += f"--- Sub-Section {i+1} ---\n{sub}\n\n"
        
    final_response = execute_with_llm(LIT_REVIEW_REDUCE_PROMPT, {
        "topic": topic,
        "context": reduce_context
    })
    
    return final_response.content

from database.graph_db import merge_graph_data

def generate_project_graph(project_id: str):
    if project_id not in projects_db:
        raise Exception("Project not found.")
        
    project = projects_db[project_id]
    papers = project.get("papers", [])
    
    if not papers:
        return {"status": "error", "message": "No papers to process"}
        
    for paper in papers:
        filename = paper["filename"]
        retrieved = search_project_chunks(project_id, "abstract introduction conclusion methodologies datasets", top_k=3, filter_filename=filename)
        
        context_str = ""
        for chunk in retrieved:
            context_str += chunk.page_content + "\n\n"
            
        if not context_str:
            continue
            
        response = execute_with_llm(GRAPH_EXTRACTION_PROMPT, {"filename": filename, "context": context_str})
        output_text = response.content.strip()
        
        if output_text.startswith("```json"):
            output_text = output_text[7:-3].strip()
        elif output_text.startswith("```"):
            output_text = output_text[3:-3].strip()
            
        try:
            graph_data = json.loads(output_text)
            new_nodes = graph_data.get("nodes", [])
            new_edges = graph_data.get("edges", [])
            merge_graph_data(project_id, new_nodes, new_edges)
        except Exception as e:
            print(f"Failed to parse graph JSON for {filename}: {e}")
            
    return {"status": "success", "message": "Graph generated successfully"}

from llm.prompts import FRAME_EXTRACTION_PROMPT

def extract_paper_frames(project_id: str):
    if project_id not in projects_db:
        raise Exception("Project not found.")
        
    project = projects_db[project_id]
    papers = project.get("papers", [])
    
    if not papers:
        return []
        
    frames = []
    for paper in papers:
        filename = paper["filename"]
        retrieved = search_project_chunks(project_id, "methodology dataset evaluation metrics", top_k=5, filter_filename=filename)
        
        context_str = ""
        for chunk in retrieved:
            context_str += chunk.page_content + "\n\n"
            
        if not context_str:
            continue
            
        response = execute_with_llm(FRAME_EXTRACTION_PROMPT, {"filename": filename, "context": context_str})
        output_text = response.content.strip()
        
        if output_text.startswith("```json"):
            output_text = output_text[7:-3].strip()
        elif output_text.startswith("```"):
            output_text = output_text[3:-3].strip()
            
        try:
            frame_data = json.loads(output_text)
            frames.append({
                "filename": filename,
                "frame": frame_data
            })
        except Exception as e:
            print(f"Failed to parse frame JSON for {filename}: {e}")
            
    return frames

from llm.prompts import DEBATE_PROMPT

def generate_debate(project_id: str, topic: str = None):
    if project_id not in projects_db:
        raise Exception("Project not found.")
        
    project = projects_db[project_id]
    search_topic = topic if topic and topic.strip() else project.get("topic", "")
    
    retrieved = search_project_chunks(project_id, search_topic + " advantages disadvantages pros cons limitations benefits", top_k=8)
    
    if not retrieved:
        return []
        
    context_str = ""
    for i, chunk in enumerate(retrieved):
        context_str += f"--- Excerpt {i+1} ---\n{chunk.page_content}\n\n"
        
    response = execute_with_llm(DEBATE_PROMPT, {"topic": search_topic, "context": context_str})
    output_text = response.content.strip()
    
    if output_text.startswith("```json"):
        output_text = output_text[7:-3].strip()
    elif output_text.startswith("```"):
        output_text = output_text[3:-3].strip()
        
    try:
        debate_data = json.loads(output_text)
        return debate_data.get("debate", [])
    except Exception as e:
        print(f"Failed to parse debate JSON: {e}")
        return []
