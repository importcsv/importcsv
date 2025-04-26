import asyncio
import logging
import os
import sys
import uuid
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, List

from fastapi_users.password import PasswordHelper
from sqlalchemy import select, text
from sqlalchemy.exc import SQLAlchemyError

from app.db.base import Base, async_session_maker, get_db_context
from app.models.user import User
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(os.getcwd(), "db_init.log"))
    ]
)
logger = logging.getLogger("db_init")


class DatabaseInitializer:
    """Class to handle database initialization and setup tasks"""
    
    def __init__(self, skip_migrations: bool = False, verbose: bool = True):
        self.skip_migrations = skip_migrations
        self.verbose = verbose
        self.migration_output = ""
    
    def apply_migrations(self) -> bool:
        """Apply all pending Alembic migrations"""
        if self.skip_migrations:
            logger.info("Skipping migrations as requested")
            return True
            
        try:
            logger.info("Applying database migrations with Alembic...")
            # Run alembic upgrade
            result = subprocess.run(
                ["alembic", "upgrade", "head"],
                check=True,
                capture_output=True,
                text=True
            )
            self.migration_output = result.stdout
            
            if self.verbose:
                logger.info("Applied migrations:")
                logger.info(result.stdout)
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"Error applying migrations: {e}")
            logger.error(f"Error output: {e.stderr}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during migrations: {str(e)}")
            return False
    
    async def check_database_connection(self) -> bool:
        """Verify database connection is working"""
        try:
            logger.info("Testing database connection...")
            async with async_session_maker() as session:
                # Simple query to test connection
                result = await session.execute(text("SELECT 1"))
                if result.scalar() == 1:
                    logger.info("Database connection successful")
                    return True
                else:
                    logger.error("Database connection test failed")
                    return False
        except Exception as e:
            logger.error(f"Database connection error: {str(e)}")
            return False
    
    async def create_superuser(self, email: str, password: str, full_name: Optional[str] = None) -> Optional[User]:
        """Create a superuser if it doesn't already exist"""
        try:
            logger.info(f"Checking if superuser {email} exists...")
            async with async_session_maker() as session:
                # Check if user exists
                query = select(User).where(User.email == email)
                result = await session.execute(query)
                user = result.scalar_one_or_none()

                if not user:
                    logger.info(f"Creating new superuser: {email}")
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
                    logger.info(f"Superuser {email} created successfully")
                else:
                    logger.info(f"Superuser {email} already exists")

                return user
        except SQLAlchemyError as e:
            logger.error(f"Database error creating superuser: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error creating superuser: {str(e)}")
            return None
    
    async def initialize_database(self) -> Dict[str, Any]:
        """Run the complete database initialization process"""
        results = {
            "success": False,
            "connection_ok": False,
            "migrations_applied": False,
            "superuser_created": False,
            "errors": []
        }
        
        # Check database connection
        results["connection_ok"] = await self.check_database_connection()
        if not results["connection_ok"]:
            results["errors"].append("Database connection failed")
            return results
            
        # Apply migrations
        results["migrations_applied"] = self.apply_migrations()
        if not results["migrations_applied"] and not self.skip_migrations:
            results["errors"].append("Failed to apply database migrations")
            return results
            
        # Create superuser if credentials are provided
        if settings.ADMIN_EMAIL and settings.ADMIN_PASSWORD:
            user = await self.create_superuser(
                email=settings.ADMIN_EMAIL,
                password=settings.ADMIN_PASSWORD,
                full_name=settings.ADMIN_NAME
            )
            results["superuser_created"] = user is not None
            if not results["superuser_created"]:
                results["errors"].append("Failed to create superuser")
        else:
            logger.warning("No admin credentials provided, skipping superuser creation")
            
        # Set overall success
        results["success"] = (results["connection_ok"] and 
                            (results["migrations_applied"] or self.skip_migrations) and 
                            (results["superuser_created"] or not (settings.ADMIN_EMAIL and settings.ADMIN_PASSWORD)))
        
        return results


# Run this to initialize the database
async def init_db() -> Dict[str, Any]:
    """Initialize the database with migrations and initial data"""
    # Get command line arguments
    skip_migrations = "--skip-migrations" in sys.argv
    verbose = "--quiet" not in sys.argv
    
    initializer = DatabaseInitializer(skip_migrations=skip_migrations, verbose=verbose)
    return await initializer.initialize_database()


# For running directly
if __name__ == "__main__":
    logger.info("Starting database initialization")
    results = asyncio.run(init_db())
    
    if results["success"]:
        logger.info("Database initialization completed successfully")
        sys.exit(0)
    else:
        logger.error(f"Database initialization failed: {results['errors']}")
        sys.exit(1)
