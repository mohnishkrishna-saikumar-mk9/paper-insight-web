import json
import hashlib
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

CONFIG_PATH = Path(__file__).parent / "config.json"
router = APIRouter(prefix="/api/auth", tags=["auth"])


def _load() -> dict:
    if not CONFIG_PATH.exists():
        return {"secrets": {}, "pin_hash": None}
    return json.loads(CONFIG_PATH.read_text())


def _save(config: dict) -> None:
    CONFIG_PATH.write_text(json.dumps(config, indent=2))


def _hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode()).hexdigest()


def set_secret(session: dict, name: str, value: str) -> None:
    config = _load()
    if "secrets" not in config:
        config["secrets"] = {}
    config["secrets"][name] = value
    _save(config)


def get_secret(session: dict, name: str) -> str | None:
    return _load().get("secrets", {}).get(name)


def has_secret(name: str) -> bool:
    return name in _load().get("secrets", {})


def require_session(request: Request) -> dict:
    return {"key": "dummy"}


@router.get("/status")
def status():
    config = _load()
    return {
        "setup": True,
        "authenticated": True,
        "has_pin": config.get("pin_hash") is not None
    }


class PinIn(BaseModel):
    pin: str


@router.post("/pin/set")
def set_pin(body: PinIn):
    if len(body.pin) != 4 or not body.pin.isdigit():
        raise HTTPException(400, "PIN must be exactly 4 digits")
    config = _load()
    if config.get("pin_hash"):
        raise HTTPException(400, "PIN already set. Use /pin/verify to verify.")
    config["pin_hash"] = _hash_pin(body.pin)
    _save(config)
    return {"ok": True}


@router.post("/pin/verify")
def verify_pin(body: PinIn):
    config = _load()
    stored_hash = config.get("pin_hash")
    if not stored_hash:
        raise HTTPException(400, "No PIN set yet")
    if _hash_pin(body.pin) != stored_hash:
        raise HTTPException(401, "Incorrect PIN")
    return {"ok": True}


@router.post("/pin/reset")
def reset_pin(body: PinIn):
    """Reset PIN — requires current PIN first."""
    config = _load()
    stored_hash = config.get("pin_hash")
    if not stored_hash:
        raise HTTPException(400, "No PIN set yet")
    if _hash_pin(body.pin) != stored_hash:
        raise HTTPException(401, "Incorrect current PIN")
    config["pin_hash"] = None
    _save(config)
    return {"ok": True, "message": "PIN cleared. Set a new one now."}


# Dummy routes for backward compatibility
@router.post("/login")
def login(): return {"ok": True}


@router.post("/logout")
def logout(): return {"ok": True}


@router.post("/setup")
def setup(): return {"ok": True, "recovery_code": "disabled"}
