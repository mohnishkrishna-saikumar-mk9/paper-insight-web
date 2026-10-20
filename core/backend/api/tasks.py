from fastapi import APIRouter, HTTPException
from database.tasks_db import get_task, get_project_tasks, delete_task

router = APIRouter()

@router.get("/project/{project_id}/tasks")
async def api_get_project_tasks(project_id: str):
    tasks = get_project_tasks(project_id)
    return {"tasks": tasks}

@router.get("/tasks/{task_id}")
async def api_get_task(task_id: str):
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.delete("/tasks/{task_id}")
async def api_delete_task(task_id: str):
    success = delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success"}
