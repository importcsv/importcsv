import requests
import json
import os
import pandas as pd
import csv

# API base URL
BASE_URL = "http://127.0.0.1:8090"

def get_access_token(email, password):
    """Get access token by logging in"""
    login_data = {
        "username": email,
        "password": password
    }
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        data=login_data
    )
    if response.status_code == 200:
        token_data = response.json()
        print("Login successful! Access token received.")
        return token_data.get("access_token")
    else:
        print(f"Login failed with status code: {response.status_code}")
        print(response.text)
        return None

def get_schema_id(token):
    """Get the first schema ID"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/v1/schemas/", headers=headers)
    
    if response.status_code == 200:
        schemas = response.json()
        if schemas:
            return schemas[0]["id"]
    return None

def create_test_csv():
    """Create a test CSV file for upload"""
    filename = "test_customers.csv"
    data = [
        ["First Name", "Last Name", "Email", "Age"],
        ["John", "Doe", "john.doe@example.com", "32"],
        ["Jane", "Smith", "jane.smith@example.com", "28"],
        ["Bob", "Johnson", "bob.johnson@example.com", "45"],
        ["Alice", "Williams", "alice.williams@example.com", "37"],
        ["Charlie", "Brown", "charlie.brown@example.com", "29"]
    ]
    
    with open(filename, 'w', newline='') as file:
        writer = csv.writer(file)
        writer.writerows(data)
    
    print(f"Created test CSV file: {filename}")
    return filename

def test_file_upload(token, file_path):
    """Test file upload endpoint"""
    headers = {"Authorization": f"Bearer {token}"}
    
    with open(file_path, 'rb') as file:
        files = {'file': (os.path.basename(file_path), file, 'text/csv')}
        response = requests.post(
            f"{BASE_URL}/api/v1/imports/upload",
            headers=headers,
            files=files
        )
    
    if response.status_code == 200:
        upload_data = response.json()
        print("File upload successful!")
        print(f"Detected {len(upload_data['columns'])} columns and {upload_data['row_count']} rows")
        print("Sample data:", json.dumps(upload_data['sample_data'][0], indent=2))
        print("Detected schema:", json.dumps(upload_data['detected_schema'][0], indent=2))
        return upload_data
    else:
        print(f"File upload failed with status code: {response.status_code}")
        print(response.text)
        return None

def test_create_import_job(token, schema_id, upload_data):
    """Test creating an import job"""
    headers = {
        "Authorization": f"Bearer {token}",
    }
    
    # Create column mapping
    column_mapping = {}
    for col in upload_data['columns']:
        # Simple mapping strategy - lowercase and replace spaces with underscores
        schema_field = col.lower().replace(' ', '_')
        column_mapping[col] = schema_field
    
    # Prepare form data
    form_data = {
        "schema_id": schema_id,
        "file_path": upload_data['file_path'],
        "file_name": upload_data['file_name'],
        "file_type": "csv",
        "column_mapping": json.dumps(column_mapping)
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/imports/",
        headers=headers,
        data=form_data
    )
    
    if response.status_code == 200:
        import_job = response.json()
        print("Import job created successfully!")
        print(f"Import Job ID: {import_job['id']}")
        print(f"Status: {import_job['status']}")
        return import_job
    else:
        print(f"Failed to create import job. Status code: {response.status_code}")
        print(response.text)
        return None

def test_get_import_job(token, import_job_id):
    """Test getting import job status"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{BASE_URL}/api/v1/imports/{import_job_id}",
        headers=headers
    )
    
    if response.status_code == 200:
        import_job = response.json()
        print(f"Import Job Status: {import_job['status']}")
        print(f"Processed Rows: {import_job['processed_rows']} / {import_job['row_count']}")
        return import_job
    else:
        print(f"Failed to get import job. Status code: {response.status_code}")
        print(response.text)
        return None

if __name__ == "__main__":
    # Get access token
    token = get_access_token("admin@example.com", "admin123")
    
    if not token:
        print("Authentication failed. Exiting.")
        exit(1)
    
    # Get schema ID
    schema_id = get_schema_id(token)
    if not schema_id:
        print("No schema found. Please create a schema first.")
        exit(1)
    
    print(f"Using schema ID: {schema_id}")
    
    # Create test CSV file
    csv_file = create_test_csv()
    
    # Test file upload
    upload_data = test_file_upload(token, csv_file)
    
    if upload_data:
        # Test creating import job
        import_job = test_create_import_job(token, schema_id, upload_data)
        
        if import_job:
            # Test getting import job status
            test_get_import_job(token, import_job['id'])
    
    # Clean up test file
    if os.path.exists(csv_file):
        os.remove(csv_file)
        print(f"Removed test file: {csv_file}")
