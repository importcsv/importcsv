import os
from sqlalchemy.orm import Session
from app.db.base import SessionLocal
from app.db.init_db import init_db, create_superuser
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def init():
    db = SessionLocal()
    try:
        # Create tables
        init_db()
        
        # Create superuser if ADMIN_EMAIL and ADMIN_PASSWORD are set
        admin_email = os.getenv("ADMIN_EMAIL")
        admin_password = os.getenv("ADMIN_PASSWORD")
        admin_name = os.getenv("ADMIN_NAME", "Admin")
        
        if admin_email and admin_password:
            create_superuser(db, admin_email, admin_password, admin_name)
            print(f"Superuser {admin_email} created successfully")
        
        print("Database initialized successfully")
    finally:
        db.close()

if __name__ == "__main__":
    init()
