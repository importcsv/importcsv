# scripts/reset_password.py
import sys
import os
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi_users.password import PasswordHelper

# Adjust the path to import from the app directory
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(backend_dir)

from app.core.config import settings
from app.models.user import User  # Adjust import path if necessary
from app.models.schema import Schema # Add import for Schema model
from app.models.import_job import ImportJob # Add import for ImportJob model
from app.models.webhook import WebhookEvent # Add import for WebhookEvent model

# Create a password helper from FastAPI-Users
password_helper = PasswordHelper()

DATABASE_URL = settings.DATABASE_URL
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def reset_user_password(email: str, new_password: str):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Error: User with email {email} not found.")
            return

        # Use FastAPI-Users' password helper for hashing
        hashed_password = password_helper.hash(new_password)
        user.hashed_password = hashed_password
        user.is_active = True # Ensure the user is active
        db.add(user)
        db.commit()
        print(f"Password for user {email} has been reset and user activated successfully.")

    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python scripts/reset_password.py <user_email> <new_password>")
        sys.exit(1)

    user_email = sys.argv[1]
    new_password = sys.argv[2]

    reset_user_password(user_email, new_password)
