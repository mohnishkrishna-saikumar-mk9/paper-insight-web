from fastapi import APIRouter, Form
from rag.generator import query_project

router = APIRouter()

@router.post("/chat")
async def chat(projectId: str = Form(...), message: str = Form(...)):
    response = query_project(projectId, message)
    return {"response": response}
