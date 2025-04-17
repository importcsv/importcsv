import requests
import json
import os
import pandas as pd
import csv
import time

# API base URL
BASE_URL = "http://127.0.0.1:8000"

def get_access_token(email, password):
    """Get access token by logging in"""
    login_data = {
        "username": email,
        "password": password
    }
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/jwt/login", # Correct endpoint for fastapi-users JWT auth
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

def poll_import_job_until_complete(token, import_job_id, max_attempts=10, delay_seconds=2):
    """Poll the import job until it's completed or max attempts are reached"""
    headers = {"Authorization": f"Bearer {token}"}

    print(f"\n=== Polling Import Job {import_job_id} ===")
    for attempt in range(1, max_attempts + 1):
        print(f"Polling attempt {attempt}/{max_attempts}...")

        response = requests.get(
            f"{BASE_URL}/api/v1/imports/{import_job_id}",
            headers=headers
        )

        if response.status_code != 200:
            print(f"Failed to get import job. Status code: {response.status_code}")
            print(response.text)
            return None

        import_job = response.json()
        status = import_job.get('status')
        processed_rows = import_job.get('processed_rows', 0)
        total_rows = import_job.get('row_count', 0)

        print(f"Status: {status} | Processed: {processed_rows}/{total_rows} rows")

        # Check if job is complete
        if status in ['completed', 'failed', 'error']:
            print(f"Import job {status}!")
            return import_job

        # If not complete, wait before next attempt
        if attempt < max_attempts:
            print(f"Waiting {delay_seconds} seconds before next check...")
            time.sleep(delay_seconds)

    print("Max polling attempts reached. Import job may still be processing.")
    return None

def manually_process_import_job(token, import_job_id):
    """Manually process an import job for testing purposes"""
    headers = {"Authorization": f"Bearer {token}"}

    print(f"\n=== Manually Processing Import Job {import_job_id} ===")
    response = requests.post(
        f"{BASE_URL}/api/v1/imports/{import_job_id}/process",
        headers=headers
    )

    if response.status_code != 200:
        print(f"Failed to process import job. Status code: {response.status_code}")
        print(response.text)
        print("Note: Your backend may not have an endpoint to process imports.")
        print("This is likely why jobs stay in 'pending' state.")
        return None

    processed_job = response.json()
    print(f"Import job processed successfully!")
    print(f"New status: {processed_job.get('status')}")
    return processed_job

def get_import_job_details(token, import_job_id):
    """Get detailed information about an import job"""
    headers = {"Authorization": f"Bearer {token}"}

    print(f"\n=== Getting Import Job Details for {import_job_id} ===")
    response = requests.get(
        f"{BASE_URL}/api/v1/imports/{import_job_id}",
        headers=headers
    )

    if response.status_code != 200:
        print(f"Failed to get import job details. Status code: {response.status_code}")
        print(response.text)
        return None

    job_details = response.json()

    # Print job metadata
    print(f"Import Job ID: {job_details['id']}")
    print(f"Status: {job_details['status']}")
    print(f"File: {job_details['file_name']}")
    print(f"Total Rows: {job_details['row_count']}")
    print(f"Successfully Processed: {job_details['processed_rows']}")
    print(f"Errors: {job_details['error_count']}")

    if job_details.get('created_at'):
        print(f"Created: {job_details['created_at']}")

    if job_details.get('completed_at'):
        print(f"Completed: {job_details['completed_at']}")

    if job_details.get('error_message'):
        print(f"Error Message: {job_details['error_message']}")

    return job_details

def create_schema(token, schema_name, columns):
    """Create a new schema or find an existing one by name."""
    headers = {"Authorization": f"Bearer {token}"}
    schema_data = {
        "name": schema_name,
        "description": f"Test schema for {schema_name}",
        "fields": [
            {"name": col.lower().replace(' ', '_'), "type": "string"} for col in columns
        ]
    }
    # Attempt to create the schema
    response = requests.post(
        f"{BASE_URL}/api/v1/schemas/",
        headers=headers,
        json=schema_data
    )
    if response.status_code == 200:
        new_schema = response.json()
        print(f"Successfully created schema: {new_schema['name']} (ID: {new_schema['id']})")
        return new_schema['id']
    elif response.status_code == 400 and "already exists" in response.text:
        # If creation failed because it already exists, find it
        print(f"Schema '{schema_name}' already exists. Attempting to find its ID...")
        schemas_response = requests.get(f"{BASE_URL}/api/v1/schemas/", headers=headers)
        if schemas_response.status_code == 200:
            schemas = schemas_response.json()
            for schema in schemas:
                if schema['name'] == schema_name:
                    print(f"Found existing schema: {schema['name']} (ID: {schema['id']})")
                    return schema['id']
        print(f"Could not find existing schema named '{schema_name}' after creation attempt failed.")
        return None
    else:
        print(f"Failed to create schema. Status code: {response.status_code}")
        print(response.text)
        return None

if __name__ == "__main__":
    # Get access token
    token = get_access_token("admin@example.com", "admin123")

    if not token:
        print("Authentication failed. Exiting.")
        exit(1)

    # Define schema details based on test CSV
    schema_name = "Test Customer Schema"
    test_columns = ["First Name", "Last Name", "Email", "Age"]

    # Create or get schema ID
    schema_id = create_schema(token, schema_name, test_columns)

    if not schema_id:
        print("Failed to create or find a suitable schema. Exiting.")
        exit(1)

    print(f"Using schema ID: {schema_id}")

    # Create test CSV file
    csv_file = create_test_csv()

    # Test file upload
    upload_data = test_file_upload(token, csv_file)

    if upload_data and schema_id:
        # Test creating import job
        import_job = test_create_import_job(token, schema_id, upload_data)

        if import_job:
            # Test getting import job status
            test_get_import_job(token, import_job['id'])

            # Poll for a few attempts to see if the job completes on its own
            print("\nChecking if job completes automatically...")
            completed_job = poll_import_job_until_complete(token, import_job['id'], max_attempts=5, delay_seconds=2)

            # If job is still pending, try to manually process it
            if completed_job and completed_job.get('status') == 'pending':
                print("\nJob still pending. Attempting to manually process it...")
                processed_job = manually_process_import_job(token, import_job['id'])

                if processed_job and processed_job.get('status') == 'completed':
                    completed_job = processed_job
                else:
                    print("\nNote: The import job is still in 'pending' state because:")
                    print("1. The backend doesn't have an automatic process to handle imports")
                    print("2. There's no endpoint to manually trigger processing")
                    print("3. You would need to implement a background worker or processing endpoint")

            # If job completed (either automatically or manually), get detailed information
            if completed_job and completed_job.get('status') in ['completed', 'failed']:
                job_details = get_import_job_details(token, import_job['id'])

                # Verify the job was processed successfully
                if job_details and job_details.get('status') == 'completed':
                    print("\n✅ Import job completed successfully!")
                elif job_details:
                    print(f"\n❌ Import job failed: {job_details.get('error_message', 'Unknown error')}")

    # Clean up test file
    if os.path.exists(csv_file):
        os.remove(csv_file)
        print(f"Removed test file: {csv_file}")
