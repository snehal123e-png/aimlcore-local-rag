from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
PROCESSED_DIR = DATA_DIR / "processed"
INDEX_DIR = DATA_DIR / "indexes"

class Settings(BaseSettings):
    app_name: str = "AIMLCore Local Knowledge Assistant"
    app_env: str = "development"
    database_url: str = "sqlite:///./aimlcore.db"
    ollama_base_url: str = "http://localhost:11434"
    llm_model: str = "llama3.2"
    embedding_model: str = "all-MiniLM-L6-v2"
    chunk_size: int = 600
    chunk_overlap: int = 100
    top_k: int = 5
    relevance_threshold: float = 0.35
    max_upload_size_mb: int = 25
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

settings = Settings()
for d in (UPLOAD_DIR, PROCESSED_DIR, INDEX_DIR): d.mkdir(parents=True, exist_ok=True)
