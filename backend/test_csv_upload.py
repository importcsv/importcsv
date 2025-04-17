import requests
import json
import os
import uuid
from pathlib import Path

# API base URL - Update this to match your server
BASE_URL = "http://127.0.0.1:8000"

def login(email="admin@example.com", password="admin123"):
    """Login and get access token"""
    login_data = {
        "username": email,
        "password": password
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/jwt/login",
        data=login_data
    )
    
    if response.status_code == 200:
        token_data = response.json()
        print("Login successful!")
        return token_data.get("access_token")
    else:
        print(f"Login failed with status code: {response.status_code}")
        print(response.text)
        return None

def create_test_csv():
    """Create a test CSV file for upload"""
    csv_path = Path("./test_data.csv")
    
    # Create a simple CSV file with header and a few rows
    csv_content = """first_name,last_name,email,age
John,Doe,john.doe@example.com,30
Jane,Smith,jane.smith@example.com,28
Bob,Johnson,bob.johnson@example.com,45
"""
    
    with open(csv_path, "w") as f:
        f.write(csv_content)
    
    print(f"Created test CSV file at {csv_path.absolute()}")
    return csv_path

def upload_file(token, file_path):
    """Upload a file for analysis"""
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    with open(file_path, "rb") as f:
        files = {"file": (file_path.name, f, "text/csv")}
        response = requests.post(
            f"{BASE_URL}/api/v1/imports/upload",
            headers=headers,
            files=files
        )
    
    print(f"Upload Response Status: {response.status_code}")
    if response.status_code == 200:
        upload_data = response.json()
        print("File Upload Successful!")
        print(f"File Path: {upload_data.get('file_path')}")
        print(f"Detected {len(upload_data.get('columns', []))} columns")
        print(f"Row Count: {upload_data.get('row_count')}")
        return upload_data
    else:
        print("File Upload Failed")
        print(response.text)
        return None

def get_schemas(token):
    """Get available schemas"""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/v1/schemas/",
        headers=headers
    )
    
    if response.status_code == 200:
        schemas = response.json()
        if schemas:
            print(f"Found {len(schemas)} schemas")
            for i, schema in enumerate(schemas):
                print(f"  Schema {i+1}: {schema.get('name')} (ID: {schema.get('id')})")
            return schemas
        else:
            print("No schemas found. Creating a test schema...")
            return create_test_schema(token)
    else:
        print(f"Failed to get schemas. Status code: {response.status_code}")
        print(response.text)
        return None

def create_test_schema(token):
    """Create a test schema if none exists"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    schema_data = {
        "name": f"Test Customer Schema {uuid.uuid4().hex[:6]}",
        "description": "Schema for customer data import",
        "fields": [
            {
                "name": "first_name",
                "display_name": "First Name",
                "type": "string",
                "required": True,
                "description": "Customer's first name"
            },
            {
                "name": "last_name",
                "display_name": "Last Name",
                "type": "string",
                "required": True,
                "description": "Customer's last name"
            },
            {
                "name": "email",
                "display_name": "Email",
                "type": "string",
                "required": True,
                "description": "Customer's email address"
            },
            {
                "name": "age",
                "display_name": "Age",
                "type": "number",
                "required": False,
                "description": "Customer's age"
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/schemas/",
        headers=headers,
        json=schema_data
    )
    
    if response.status_code in (200, 201):
        schema = response.json()
        print(f"Created test schema: {schema.get('name')} (ID: {schema.get('id')})")
        return [schema]
    else:
        print(f"Failed to create schema. Status code: {response.status_code}")
        print(response.text)
        return None

def create_import_job(token, schema_id, upload_data):
    """Create an import job using the uploaded file and schema"""
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Create a simple column mapping
    file_columns = upload_data.get('columns', [])
    schema_fields = ["first_name", "last_name", "email", "age"]
    
    # Map columns to schema fields based on matching names
    column_mapping = {}
    for i, col in enumerate(file_columns):
        if i < len(schema_fields):
            column_mapping[col] = schema_fields[i]
    
    # Prepare form data
    form_data = {
        "schema_id": str(schema_id),
        "file_path": upload_data.get('file_path'),
        "file_name": upload_data.get('file_name'),
        "file_type": "csv",
        "column_mapping": json.dumps(column_mapping)
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/imports/",
        headers=headers,
        data=form_data
    )
    
    print(f"Create Import Job Response Status: {response.status_code}")
    if response.status_code in (200, 201):
        import_job = response.json()
        print("Import Job Created Successfully!")
        print(f"Import Job ID: {import_job.get('id')}")
        print(f"Status: {import_job.get('status')}")
        return import_job
    else:
        print("Failed to create import job")
        print(response.text)
        return None

def get_import_jobs(token):
    """Get all import jobs"""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/v1/imports/",
        headers=headers
    )
    
    print(f"Get Import Jobs Response Status: {response.status_code}")
    if response.status_code == 200:
        import_jobs = response.json()
        print(f"Found {len(import_jobs)} import jobs")
        for i, job in enumerate(import_jobs):
            print(f"  Job {i+1}: {job.get('file_name')} (ID: {job.get('id')}, Status: {job.get('status')})")
        return import_jobs
    else:
        print("Failed to get import jobs")
        print(response.text)
        return None

def get_import_job_details(token, import_job_id):
    """Get details of a specific import job"""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/v1/imports/{import_job_id}",
        headers=headers
    )
    
    print(f"Get Import Job Details Response Status: {response.status_code}")
    if response.status_code == 200:
        job_details = response.json()
        print(f"Import Job Details for ID: {job_details.get('id')}")
        print(f"  File: {job_details.get('file_name')}")
        print(f"  Status: {job_details.get('status')}")
        print(f"  Row Count: {job_details.get('row_count')}")
        print(f"  Processed Rows: {job_details.get('processed_rows')}")
        print(f"  Error Count: {job_details.get('error_count')}")
        return job_details
    else:
        print("Failed to get import job details")
        print(response.text)
        return None

def run_csv_upload_test():
    """Run the full CSV upload test flow"""
    print("\n=== Starting CSV Upload Test ===\n")
    
    # Step 1: Login to get token
    print("\n=== Step 1: Login ===")
    token = login()
    if not token:
        print("Login failed. Cannot continue test.")
        return
    
    # Step 2: Create test CSV file
    print("\n=== Step 2: Create Test CSV ===")
    csv_path = create_test_csv()
    
    # Step 3: Upload the CSV file
    print("\n=== Step 3: Upload CSV File ===")
    upload_data = upload_file(token, csv_path)
    if not upload_data:
        print("File upload failed. Cannot continue test.")
        return
    
    # Step 4: Get or create schema
    print("\n=== Step 4: Get or Create Schema ===")
    schemas = get_schemas(token)
    if not schemas:
        print("Failed to get or create schema. Cannot continue test.")
        return
    
    # Use the first schema
    schema_id = schemas[0].get('id')
    
    # Step 5: Create import job
    print("\n=== Step 5: Create Import Job ===")
    import_job = create_import_job(token, schema_id, upload_data)
    if not import_job:
        print("Failed to create import job. Cannot continue test.")
        return
    
    # Step 6: Get all import jobs
    print("\n=== Step 6: Get All Import Jobs ===")
    import_jobs = get_import_jobs(token)
    
    # Step 7: Get import job details
    if import_job:
        print("\n=== Step 7: Get Import Job Details ===")
        job_details = get_import_job_details(token, import_job.get('id'))
    
    # Clean up test file
    if os.path.exists(csv_path):
        os.remove(csv_path)
        print(f"\nRemoved test CSV file: {csv_path}")
    
    print("\n=== CSV Upload Test Completed ===\n")

if __name__ == "__main__":
    run_csv_upload_test()
