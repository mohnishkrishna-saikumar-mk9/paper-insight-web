import json
from pathlib import Path
from typing import Literal
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from security.security import get_secret, has_secret, require_session, set_secret

router = APIRouter(prefix="/api/llm", tags=["llm"])

CONFIG_PATH = Path(__file__).parent.parent / "security" / "llm_config.json"
KEY_NAME = "llm_api_key"

DEFAULTS = {
    "mode": "omniroute",
    "omniroute": {"base_url": "http://127.0.0.1:20128/v1", "combo": "Research Paper"},
    "direct": {"base_url": "https://api.openai.com/v1", "model": ""},
}


class SettingsIn(BaseModel):
    mode: Literal["direct", "omniroute"]
    base_url: str = Field(max_length=300)
    model: str = Field(default="", max_length=200)   # model (direct) or combo name (omomniroute)
    api_key: str | None = Field(default=None, max_length=500)  # None = keep the saved key


def _clean_url(url: str) -> str:
    url = url.strip().rstrip("/")
    p = urlparse(url)
    if p.scheme not in ("http", "https") or not p.netloc:
        raise HTTPException(400, "Base URL must start with http:// or https://")
    return url


def _read() -> dict:
    if CONFIG_PATH.exists():
        return json.loads(CONFIG_PATH.read_text())
    return json.loads(json.dumps(DEFAULTS))


def _write(cfg: dict) -> None:
    CONFIG_PATH.write_text(json.dumps(cfg, indent=2))


@router.get("/settings")
def get_settings(session=Depends(require_session)):
    cfg = _read()
    return {**cfg, "has_key": has_secret(KEY_NAME)}


@router.put("/settings")
def save_settings(body: SettingsIn, session=Depends(require_session)):
    base = _clean_url(body.base_url)
    if not body.model.strip():
        raise HTTPException(400, "Model / combo name is required")
    cfg = _read()
    cfg["mode"] = body.mode
    if body.mode == "omniroute":
        cfg["omniroute"] = {"base_url": base, "combo": body.model.strip()}
    else:
        cfg["direct"] = {"base_url": base, "model": body.model.strip()}
    _write(cfg)
    if body.api_key:  # only overwrite when a new key is typed
        set_secret(session, KEY_NAME, body.api_key.strip())
    return {"ok": True, "has_key": has_secret(KEY_NAME)}


def active_connection(session: dict) -> tuple[str, str, str]:
    """Used by llm/models.py:  base_url, api_key, model = active_connection(session)"""
    cfg = _read()
    key = get_secret(session, KEY_NAME) or ""
    if cfg["mode"] == "omniroute":
        return cfg["omniroute"]["base_url"], key, cfg["omniroute"]["combo"]
    return cfg["direct"]["base_url"], key, cfg["direct"]["model"]


@router.post("/test")
async def test_connection(session=Depends(require_session)):
    """Sends a 1-token request so the user sees right away whether it works."""
    base, key, model = active_connection(session)
    if not model:
        raise HTTPException(400, "Save settings first")
    headers = {"Authorization": f"Bearer {key}"} if key else {}
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(
                f"{base}/chat/completions", headers=headers,
                json={"model": model, "max_tokens": 1,
                      "messages": [{"role": "user", "content": "ping"}]},
            )
    except httpx.ConnectError:
        raise HTTPException(502, "Cannot reach the server. Is OmniRoute running?")
    except httpx.TimeoutException:
        raise HTTPException(504, "Connection timed out")
    if r.status_code in (401, 403):
        raise HTTPException(401, "API key rejected")
    if r.status_code == 404:
        raise HTTPException(404, "Endpoint or model/combo not found. Check the URL and name.")
    if r.status_code >= 400:
        raise HTTPException(502, f"Provider returned {r.status_code}")
    return {"ok": True, "model": model}
