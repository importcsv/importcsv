import requests
import json

# API base URL
BASE_URL = "http://127.0.0.1:8090"

def test_health_check():
    """Test the health check endpoint"""
    response = requests.get(f"{BASE_URL}/")
    print("Health Check Response:", response.json())
    assert response.status_code == 200
    return response.json()

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

def test_get_user_me(token):
    """Test getting current user info"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/v1/users/me", headers=headers)
    if response.status_code == 200:
        user_data = response.json()
        print("Current User Data:", json.dumps(user_data, indent=2))
        return user_data
    else:
        print(f"Failed to get user data. Status code: {response.status_code}")
        print(response.text)
        return None

def test_create_schema(token):
    """Test creating a schema"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    schema_data = {
        "name": "Test Customer Schema",
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
    
    if response.status_code == 200:
        schema = response.json()
        print("Created Schema:", json.dumps(schema, indent=2))
        return schema
    else:
        print(f"Failed to create schema. Status code: {response.status_code}")
        print(response.text)
        return None

def test_get_schemas(token):
    """Test getting all schemas"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/v1/schemas/", headers=headers)
    
    if response.status_code == 200:
        schemas = response.json()
        print(f"Found {len(schemas)} schemas:")
        for schema in schemas:
            print(f"  - {schema['name']} (ID: {schema['id']})")
        return schemas
    else:
        print(f"Failed to get schemas. Status code: {response.status_code}")
        print(response.text)
        return None

if __name__ == "__main__":
    # Test health check
    test_health_check()
    
    # Get access token
    token = get_access_token("admin@example.com", "admin123")
    
    if token:
        # Test user endpoint
        user = test_get_user_me(token)
        
        # Test schema endpoints
        schema = test_create_schema(token)
        schemas = test_get_schemas(token)
