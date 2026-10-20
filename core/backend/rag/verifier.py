import json
from llm.models import execute_with_llm
from llm.prompts import CLAIM_EXTRACTION_PROMPT, HALLUCINATION_CHECK_PROMPT
from rag.retriever import search_project_chunks

def verify_draft(project_id: str, draft_text: str):
    # Step 1: Extract claims
    response = execute_with_llm(CLAIM_EXTRACTION_PROMPT, {"draft": draft_text})
    output_text = response.content.strip()
    
    if output_text.startswith("```json"):
        output_text = output_text[7:-3].strip()
    elif output_text.startswith("```"):
        output_text = output_text[3:-3].strip()
        
    try:
        claims = json.loads(output_text)
    except Exception as e:
        print(f"Failed to parse claims JSON: {e}")
        return {"status": "error", "message": "Could not parse claims"}

    results = []
    
    # Step 2 & 3: Verify each claim
    for claim in claims:
        retrieved = search_project_chunks(project_id, claim, top_k=2)
        context_str = ""
        for chunk in retrieved:
            filename = chunk.metadata.get("filename", "Unknown")
            context_str += f"=== Paper: {filename} ===\n{chunk.page_content}\n\n"
            
        verify_resp = execute_with_llm(HALLUCINATION_CHECK_PROMPT, {"claim": claim, "context": context_str})
        result_text = verify_resp.content.strip()
        
        # Parse label and explanation
        parts = result_text.split('\n', 1)
        label = parts[0].strip()
        explanation = parts[1].strip() if len(parts) > 1 else ""
        
        results.append({
            "claim": claim,
            "label": label,
            "explanation": explanation
        })
        
    return {"status": "success", "results": results}
