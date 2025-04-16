from pydantic_settings import BaseSettings
from typing import List, Optional, Union
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "ImportCSV"
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000", "http://localhost:6006", "http://localhost:5173"]
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./importcsv.db")
    
    # JWT settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-for-jwt")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # LLM settings
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4")
    USE_LOCAL_LLM: bool = os.getenv("USE_LOCAL_LLM", "false").lower() == "true"
    LOCAL_LLM_URL: Optional[str] = os.getenv("LOCAL_LLM_URL")
    
    # File upload settings
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Webhook settings
    WEBHOOK_SECRET: str = os.getenv("WEBHOOK_SECRET", "your-webhook-secret")
    
    # Admin credentials
    ADMIN_EMAIL: Optional[str] = os.getenv("ADMIN_EMAIL")
    ADMIN_PASSWORD: Optional[str] = os.getenv("ADMIN_PASSWORD")
    ADMIN_NAME: Optional[str] = os.getenv("ADMIN_NAME", "Admin User")

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
