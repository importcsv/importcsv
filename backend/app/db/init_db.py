import asyncio
import uuid
import subprocess
from typing import AsyncGenerator

from fastapi_users.password import PasswordHelper
from sqlalchemy.ext.asyncio import async_session_maker

from app.db.base import Base

# Use Alembic to apply migrations
def apply_migrations():
    """Apply all pending Alembic migrations"""
    try:
        # Run alembic upgrade
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            check=True,
            capture_output=True,
            text=True
        )
        print("Applied migrations:")
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"Error applying migrations: {e}")
        print(f"Error output: {e.stderr}")
        raise

# Create initial superuser asynchronously
async def create_superuser(email: str, password: str, full_name: str = None):
    async with async_session_maker() as session:
        # Check if user exists
        from sqlalchemy import select
        query = select(User).where(User.email == email)
        result = await session.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            password_helper = PasswordHelper()
            hashed_password = password_helper.hash(password)

            # Create new user
            user = User(
                id=uuid.uuid4(),
                email=email,
                hashed_password=hashed_password,
                full_name=full_name,
                is_superuser=True,
                is_active=True,
                is_verified=True
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            print(f"Superuser {email} created successfully.")
        else:
            print(f"Superuser {email} already exists.")

        return user

# Run this to initialize the database
async def init_db_and_create_superuser():
    from app.core.config import settings

    # Apply migrations using Alembic
    apply_migrations()

    # Create superuser if credentials are provided
    if settings.ADMIN_EMAIL and settings.ADMIN_PASSWORD:
        await create_superuser(
            email=settings.ADMIN_EMAIL,
            password=settings.ADMIN_PASSWORD,
            full_name=settings.ADMIN_NAME
        )

# For running directly
if __name__ == "__main__":
    asyncio.run(init_db_and_create_superuser())
