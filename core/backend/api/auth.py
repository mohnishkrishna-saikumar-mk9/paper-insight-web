from fastapi import APIRouter, Form
from typing import Optional, List
from pydantic import BaseModel
from services.auth_service import (
    has_setup_completed, update_password, update_secret_phrase,
    get_profile, update_profile, verify_password, verify_secret_phrase,
    get_secret_phrase
)

router = APIRouter()

class ProfileData(BaseModel):
    name: str
    role: str
    institution: str
    department: str
    avatarBase64: Optional[str] = None
    apiKeys: Optional[List[str]] = []

@router.get("/auth/status")
async def get_auth_status():
    return {"hasSetup": has_setup_completed()}

@router.post("/auth/initial_setup")
async def initial_setup(password: str = Form(...), secretPhrase: str = Form(...)):
    if has_setup_completed():
        return {"status": "error", "message": "Setup has already been completed."}
        
    p_success = update_password(password)
    s_success = update_secret_phrase(secretPhrase)
    
    if p_success and s_success:
        return {"status": "success"}
    return {"status": "error", "message": "Failed to save credentials."}

@router.get("/profile")
async def fetch_profile():
    return get_profile()

@router.post("/profile")
async def save_profile(profile: ProfileData):
    # Using model_dump (pydantic v2) or dict (pydantic v1)
    profile_dict = profile.dict() if hasattr(profile, 'dict') else profile.model_dump()
    success = update_profile(profile_dict)
    if success:
        return {"status": "success"}
    return {"status": "error", "message": "Failed to save profile"}

@router.post("/auth/verify")
async def verify_auth(password: str = Form(...)):
    is_valid = verify_password(password)
    return {"valid": is_valid}

@router.post("/auth/reset")
async def reset_auth(secretPhrase: str = Form(...), newPassword: str = Form(...)):
    if not verify_secret_phrase(secretPhrase):
        return {"status": "error", "message": "Incorrect security phrase"}
    
    success = update_password(newPassword)
    if success:
        return {"status": "success"}
    return {"status": "error", "message": "Failed to update password"}

@router.post("/auth/set_phrase")
async def set_phrase(newSecretPhrase: str = Form(...)):
    if get_secret_phrase() is not None:
        return {"status": "error", "message": "Security phrase is already set."}
        
    success = update_secret_phrase(newSecretPhrase)
    if success:
        return {"status": "success"}
    return {"status": "error", "message": "Failed to set security phrase"}

@router.post("/auth/verify_phrase")
async def verify_phrase(secretPhrase: str = Form(...)):
    if verify_secret_phrase(secretPhrase):
        return {"status": "success", "valid": True}
    return {"status": "error", "message": "Incorrect security phrase", "valid": False}
