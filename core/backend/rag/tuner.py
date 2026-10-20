import re
from rag.retriever import search_project_chunks
from database.json_db import projects_db, save_db
from llm.models import execute_with_llm
from langchain_core.prompts import PromptTemplate

EVALUATION_PROMPT = PromptTemplate.from_template("""
You are an expert evaluator for an Information Retrieval system.
You are given a research topic and a set of retrieved text chunks from a database.
Your job is to evaluate how highly relevant and useful these chunks are for answering questions about the topic.

Topic: {topic}

Retrieved Chunks:
{context}

Rate the overall relevance and quality of these chunks on a scale from 1 to 10.
You MUST output ONLY a single integer between 1 and 10. Do not output any other text, explanation, or punctuation.
""")

def tune_hybrid_alpha(project_id: str):
    if project_id not in projects_db:
        raise Exception("Project not found.")
        
    project = projects_db[project_id]
    topic = project.get("topic", "General Research")
    
    alphas_to_test = [0.0, 0.25, 0.5, 0.75, 1.0]
    best_alpha = 0.5
    best_score = -1
    
    results_log = []
    
    for alpha in alphas_to_test:
        # Temporarily set alpha for testing
        projects_db[project_id]["hybrid_alpha"] = alpha
        
        # Retrieve chunks using this alpha
        retrieved = search_project_chunks(project_id, topic, top_k=5)
        
        if not retrieved:
            results_log.append(f"Alpha {alpha}: 0 (No chunks retrieved)")
            continue
            
        context_str = ""
        for i, chunk in enumerate(retrieved):
            context_str += f"--- Chunk {i+1} ---\n{chunk.page_content}\n\n"
            
        # Evaluate with LLM
        response = execute_with_llm(EVALUATION_PROMPT, {"topic": topic, "context": context_str})
        output = response.content.strip()
        
        # Extract integer from output
        match = re.search(r'\b(10|[1-9])\b', output)
        score = int(match.group(1)) if match else 0
        
        results_log.append(f"Alpha {alpha}: Score {score}/10")
        
        if score > best_score:
            best_score = score
            best_alpha = alpha
            
    # Save the best alpha
    projects_db[project_id]["hybrid_alpha"] = best_alpha
    save_db()
    
    return {
        "best_alpha": best_alpha,
        "best_score": best_score,
        "log": results_log
    }
