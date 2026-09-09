import requests
from fastapi import APIRouter
from app.core.config import settings
router=APIRouter(prefix="/api/system",tags=["System"])
@router.get("/health")
def health():
    ollama="offline"
    try:
        r=requests.get(f"{settings.ollama_base_url}/api/tags",timeout=3)
        if r.status_code==200: ollama="online"
    except requests.RequestException: pass
    return {"status":"healthy","service":settings.app_name,"ollama":ollama}
@router.get("/models")
def models():
    try: return requests.get(f"{settings.ollama_base_url}/api/tags",timeout=5).json()
    except requests.RequestException: return {"models":[],"error":"Ollama unavailable"}
