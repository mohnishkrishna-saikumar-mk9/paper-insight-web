import json
from llm.models import execute_with_llm
from llm.prompts import DEEP_RESEARCH_PLAN_PROMPT, DEEP_RESEARCH_SYNTHESIZE_PROMPT
from rag.agents import run_agentic_query
from rag.verifier import verify_draft

def run_deep_research(task_id: str, project_id: str, topic: str):
    def log(msg):
        print(msg)
        append_task_log(task_id, msg)
        
    log(f"Deep Research Started for Project: {project_id} | Topic: {topic}")
    
    # Step 1: Plan
    plan_response = execute_with_llm(DEEP_RESEARCH_PLAN_PROMPT, {"topic": topic})
    output_text = plan_response.content.strip()
    
    if output_text.startswith("```json"):
        output_text = output_text[7:-3].strip()
    elif output_text.startswith("```"):
        output_text = output_text[3:-3].strip()
        
    try:
        # robust json extraction
        start_idx = output_text.find('[')
        end_idx = output_text.rfind(']')
        if start_idx != -1 and end_idx != -1:
            output_text = output_text[start_idx:end_idx+1]
        sub_queries = json.loads(output_text)
    except Exception as e:
        log(f"Failed to parse sub-queries JSON: {e} | Raw output: {output_text}")
        sub_queries = [topic] # Fallback to single query
        
    log(f"Deep Research Plan: {sub_queries}")
    from database.tasks_db import update_task_plan
    update_task_plan(task_id, sub_queries)
    
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    reports_text = ""
    
    # Step 2 & 3: Draft and Verify
    def process_sub_query(i, sub_query):
        log(f"\n--- Investigating Sub-Query {i+1}: {sub_query} ---")
        try:
            draft = run_agentic_query(project_id, sub_query)
            verification = verify_draft(project_id, draft)
            unsupported = []
            if verification.get("status") == "success":
                for res in verification.get("results", []):
                    if res["label"] != "SUPPORTED":
                        unsupported.append(f"- Claim: {res['claim']}\n  Warning: {res['explanation']}")
            
            report = f"\n## Sub-Topic: {sub_query}\n{draft}\n"
            if unsupported:
                report += "\n### Verification Warnings:\n" + "\n".join(unsupported) + "\n"
            return report
        except Exception as e:
            log(f"Error processing Sub-Query {i+1}: {e}")
            return f"\n## Sub-Topic: {sub_query}\nError: {e}\n"

    # Use ThreadPoolExecutor for concurrent execution
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(process_sub_query, i, sq): sq for i, sq in enumerate(sub_queries)}
        
        # Collect results as they complete
        reports_list = []
        for future in as_completed(futures):
            reports_list.append(future.result())
            
    reports_text = "".join(reports_list)
            
    # Step 4: Synthesize
    log("\n--- Synthesizing Final Report ---")
    final_response = execute_with_llm(DEEP_RESEARCH_SYNTHESIZE_PROMPT, {
        "topic": topic,
        "reports": reports_text
    })
    
    return final_response.content + "\n\n---\n## Raw Research Findings\n" + reports_text

from database.tasks_db import update_task_status, append_task_log, update_task_plan

def run_deep_research_task(task_id: str, project_id: str, topic: str):
    try:
        update_task_status(task_id, "RUNNING")
        report = run_deep_research(task_id, project_id, topic)
        update_task_status(task_id, "COMPLETED", report)
    except Exception as e:
        print(f"Deep Research Task {task_id} failed: {e}")
        append_task_log(task_id, f"ERROR: Task failed: {e}")
        update_task_status(task_id, "FAILED", str(e))
