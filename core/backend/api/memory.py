from fastapi import APIRouter, Form
from database.memory_db import get_preferences, add_preference

router = APIRouter()

@router.get("/memory")
async def list_preferences():
    return {"preferences": get_preferences()}

@router.post("/memory/add")
async def save_preference(preference: str = Form(...)):
    add_preference(preference)
    return {"status": "success", "preferences": get_preferences()}
