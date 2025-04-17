#!/bin/bash

# Create test database
echo "Creating test database..."
psql -U postgres -c "DROP DATABASE IF EXISTS importcsv_test;"
psql -U postgres -c "CREATE DATABASE importcsv_test;"

# Set environment variables for testing
export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/importcsv_test"
export SECRET_KEY="test-secret-key-for-jwt"
export TEST_UPLOAD_DIR="./test_uploads"

# Create test upload directory
mkdir -p test_uploads

# Run Alembic migrations on test database
echo "Running migrations on test database..."
DATABASE_URL=$TEST_DATABASE_URL alembic upgrade head

echo "Test database setup complete!"
