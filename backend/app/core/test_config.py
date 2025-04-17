from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class TestSettings(BaseSettings):
    # Test database settings - use a separate test database
    TEST_DATABASE_URL: str = os.getenv(
        "TEST_DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5433/importcsv_test"
    )
    
    # JWT settings - use the same as main app for simplicity
    SECRET_KEY: str = os.getenv("SECRET_KEY", "test-secret-key-for-jwt")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File upload settings - use a test directory
    UPLOAD_DIR: str = os.getenv("TEST_UPLOAD_DIR", "./test_uploads")
    
    # Admin test credentials
    TEST_ADMIN_EMAIL: str = "test_admin@example.com"
    TEST_ADMIN_PASSWORD: str = "test_password123"
    TEST_ADMIN_NAME: str = "Test Admin"
    
    # Test user credentials
    TEST_USER_EMAIL: str = "test_user@example.com"
    TEST_USER_PASSWORD: str = "test_password123"
    TEST_USER_NAME: str = "Test User"
    
    class Config:
        env_file = ".env.test"
        case_sensitive = True

test_settings = TestSettings()
