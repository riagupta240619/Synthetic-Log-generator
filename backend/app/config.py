import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Synthetic Cybersecurity Log Generator"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # MongoDB
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "synthetic_logs_db")
    
    # Local Storage fallback
    DATA_DIR: str = os.getenv("DATA_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data")))
    
    # Ollama / LLM endpoint
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")
    
    # Wazuh Manager (for optional live forwarding)
    WAZUH_HOST: str = os.getenv("WAZUH_HOST", "localhost")
    WAZUH_SYSLOG_PORT: int = int(os.getenv("WAZUH_SYSLOG_PORT", "514"))
    WAZUH_API_URL: str = os.getenv("WAZUH_API_URL", "https://localhost:55000")
    WAZUH_API_USER: str = os.getenv("WAZUH_API_USER", "wazuh")
    WAZUH_API_PASSWORD: str = os.getenv("WAZUH_API_PASSWORD", "wazuh")

settings = Settings()
os.makedirs(settings.DATA_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.DATA_DIR, "datasets"), exist_ok=True)
os.makedirs(os.path.join(settings.DATA_DIR, "uploads"), exist_ok=True)
os.makedirs(os.path.join(settings.DATA_DIR, "exports"), exist_ok=True)
