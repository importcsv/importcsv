import os
import sys
import subprocess
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_migration(message):
    """Create a new Alembic migration with the given message."""
    try:
        # Generate the migration
        result = subprocess.run(
            ["alembic", "revision", "--autogenerate", "-m", message],
            check=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)
        print("Migration file created successfully!")
    except subprocess.CalledProcessError as e:
        print(f"Error creating migration: {e}")
        print(f"Error output: {e.stderr}")
        sys.exit(1)

def apply_migrations():
    """Apply all pending migrations."""
    try:
        # Apply the migrations
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            check=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)
        print("Migrations applied successfully!")
    except subprocess.CalledProcessError as e:
        print(f"Error applying migrations: {e}")
        print(f"Error output: {e.stderr}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python create_migration.py <message> [--apply]")
        sys.exit(1)
    
    message = sys.argv[1]
    create_migration(message)
    
    # Check if --apply flag is provided
    if len(sys.argv) > 2 and sys.argv[2] == "--apply":
        apply_migrations()
