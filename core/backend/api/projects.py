from fastapi import APIRouter, Form, HTTPException
from services.project_service import setup_project, get_all_projects, get_project_data, clear_chat_history, delete_project

router = APIRouter()

@router.post("/project/create")
async def create_project(topic: str = Form(...), context: str = Form(...)):
    project_id = setup_project(topic, context)
    return {"projectId": project_id, "topic": topic, "context": context}

@router.get("/projects")
async def list_projects():
    projects = get_all_projects()
    return {"projects": projects}

from fastapi.responses import JSONResponse
from database.json_db import projects_db

@router.get("/project/{project_id}/export")
async def export_project(project_id: str):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    return JSONResponse(content=projects_db[project_id], headers={
        "Content-Disposition": f"attachment; filename=paper_insight_backup_{project_id}.json"
    })

@router.get("/project/{project_id}")
async def fetch_project(project_id: str):
    data = get_project_data(project_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return data

@router.post("/project/clear-chat")
async def clear_project_chat(projectId: str = Form(...)):
    success = clear_chat_history(projectId)
    if success:
        return {"status": "success"}
    return {"status": "error", "message": "Failed to clear chat"}

@router.post("/project/delete")
async def delete_proj(projectId: str = Form(...)):
    success = delete_project(projectId)
    if success:
        return {"status": "success"}
    return {"status": "error", "message": "Failed to delete project"}

from rag.generator import generate_research_gaps

@router.post("/project/{project_id}/generate_gaps")
async def api_generate_gaps(project_id: str):
    try:
        gaps = generate_research_gaps(project_id)
        return {"status": "success", "gaps": gaps}
    except Exception as e:
        print(f"Error generating gaps: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from rag.generator import generate_literature_review

@router.post("/project/{project_id}/generate_review")
async def api_generate_review(project_id: str):
    try:
        from database.tasks_db import create_task, update_task_status
        review = generate_literature_review(project_id)
        
        # Auto-save to history
        task_id = create_task(project_id, "Literature Review")
        update_task_status(task_id, "COMPLETED", review)
        
        return {"status": "success", "review": review, "task_id": task_id}
    except Exception as e:
        print(f"Error generating review: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from database.graph_db import load_graph
from rag.generator import generate_project_graph

@router.get("/project/{project_id}/graph")
async def get_project_graph(project_id: str):
    return load_graph(project_id)

@router.post("/project/{project_id}/build_graph")
async def build_project_graph(project_id: str):
    try:
        result = generate_project_graph(project_id)
        return result
    except Exception as e:
        print(f"Error building graph: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from rag.agents import run_agentic_query

@router.post("/project/{project_id}/query_agentic")
async def api_query_agentic(project_id: str, message: str = Form(...)):
    try:
        response = run_agentic_query(project_id, message)
        
        from database.json_db import projects_db, save_db
        if project_id in projects_db:
            projects_db[project_id].setdefault("chat_history", []).append({"role": "user", "content": message})
            projects_db[project_id]["chat_history"].append({"role": "ai", "content": response})
            save_db(project_id)
            
        return {"response": response}
    except Exception as e:
        print(f"Error in agentic query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from rag.verifier import verify_draft

@router.post("/project/{project_id}/verify")
async def api_verify_citations(project_id: str, draft: str = Form(...)):
    try:
        report = verify_draft(project_id, draft)
        return report
    except Exception as e:
        print(f"Error in verification: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from rag.recommender import get_recommendations

@router.get("/project/{project_id}/recommendations")
async def api_get_recommendations(project_id: str):
    try:
        report = get_recommendations(project_id)
        return report
    except Exception as e:
        print(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from rag.deep_research import run_deep_research_task
from database.tasks_db import create_task
from fastapi import BackgroundTasks

@router.post("/project/{project_id}/deep_research")
async def api_run_deep_research(project_id: str, background_tasks: BackgroundTasks, topic: str = Form(...)):
    try:
        task_id = create_task(project_id, topic)
        background_tasks.add_task(run_deep_research_task, task_id, project_id, topic)
        return {"status": "success", "task_id": task_id, "message": "Deep Research started in the background."}
    except Exception as e:
        print(f"Error starting deep research: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from rag.generator import extract_paper_frames

@router.get("/project/{project_id}/frames")
async def api_get_frames(project_id: str):
    try:
        frames = extract_paper_frames(project_id)
        return {"status": "success", "frames": frames}
    except Exception as e:
        print(f"Error extracting frames: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from rag.tuner import tune_hybrid_alpha

@router.post("/project/{project_id}/tune")
async def api_tune_hybrid(project_id: str):
    try:
        result = tune_hybrid_alpha(project_id)
        return {"status": "success", "result": result}
    except Exception as e:
        print(f"Error tuning hybrid alpha: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from rag.generator import generate_debate

@router.post("/project/{project_id}/debate")
async def api_generate_debate(project_id: str, topic: str = Form(None)):
    try:
        debate = generate_debate(project_id, topic)
        return {"status": "success", "debate": debate}
    except Exception as e:
        print(f"Error generating debate: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from pydantic import BaseModel

class SaveHistoryRequest(BaseModel):
    topic: str
    report: str

@router.post("/project/{project_id}/save_to_history")
async def api_save_to_history(project_id: str, payload: SaveHistoryRequest):
    try:
        task_id = create_task(project_id, payload.topic)
        from database.tasks_db import update_task_status
        update_task_status(task_id, "COMPLETED", payload.report)
        return {"status": "success", "task_id": task_id}
    except Exception as e:
        print(f"Error saving to history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
