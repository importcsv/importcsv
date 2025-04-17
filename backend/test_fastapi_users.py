import requests
import json
import uuid

# API base URL - Update this to match your server
BASE_URL = "http://127.0.0.1:8000"

def test_health_check():
    """Test the health check endpoint"""
    response = requests.get(f"{BASE_URL}/")
    print("Health Check Response:", response.json())
    assert response.status_code == 200
    return response.json()

def test_register_user():
    """Test user registration"""
    # Generate a unique email to avoid conflicts
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    
    register_data = {
        "email": unique_email,
        "password": "Password123!",
        "is_active": True,
        "is_superuser": False,
        "is_verified": False,
        "full_name": "Test User"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/register",
        json=register_data
    )
    
    print(f"Register Response Status: {response.status_code}")
    if response.status_code == 201:
        user_data = response.json()
        print("User Registration Successful!")
        print("User Data:", json.dumps(user_data, indent=2))
        return user_data
    else:
        print("User Registration Failed")
        print(response.text)
        return None

def test_login(email="admin@example.com", password="admin123"):
    """Test user login with JWT"""
    login_data = {
        "username": email,
        "password": password
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/auth/jwt/login",
        data=login_data  # Note: FastAPI Users expects form data, not JSON
    )
    
    print(f"Login Response Status: {response.status_code}")
    if response.status_code == 200:
        token_data = response.json()
        print("Login Successful!")
        print("Token Data:", json.dumps(token_data, indent=2))
        return token_data.get("access_token")
    else:
        print("Login Failed")
        print(response.text)
        return None

def test_get_current_user(token):
    """Test getting current user information"""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/v1/users/me",
        headers=headers
    )
    
    print(f"Get Current User Response Status: {response.status_code}")
    if response.status_code == 200:
        user_data = response.json()
        print("Current User Data:", json.dumps(user_data, indent=2))
        return user_data
    else:
        print("Failed to get current user")
        print(response.text)
        return None

def test_create_schema(token):
    """Test creating a schema"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    schema_data = {
        "name": f"Test Schema {uuid.uuid4().hex[:6]}",
        "description": "Schema for testing the updated API",
        "fields": [
            {
                "name": "first_name",
                "display_name": "First Name",
                "type": "string",
                "required": True,
                "description": "First name field"
            },
            {
                "name": "last_name",
                "display_name": "Last Name",
                "type": "string",
                "required": True,
                "description": "Last name field"
            },
            {
                "name": "email",
                "display_name": "Email",
                "type": "string",
                "required": True,
                "description": "Email address field"
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/schemas/",
        headers=headers,
        json=schema_data
    )
    
    print(f"Create Schema Response Status: {response.status_code}")
    if response.status_code in (200, 201):
        schema = response.json()
        print("Created Schema:", json.dumps(schema, indent=2))
        return schema
    else:
        print("Failed to create schema")
        print(response.text)
        return None

def test_get_schemas(token):
    """Test getting all schemas"""
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(
        f"{BASE_URL}/api/v1/schemas/",
        headers=headers
    )
    
    print(f"Get Schemas Response Status: {response.status_code}")
    if response.status_code == 200:
        schemas = response.json()
        print(f"Found {len(schemas)} schemas")
        for i, schema in enumerate(schemas):
            print(f"  Schema {i+1}: {schema.get('name')} (ID: {schema.get('id')})")
        return schemas
    else:
        print("Failed to get schemas")
        print(response.text)
        return None

def run_all_tests():
    """Run all tests in sequence"""
    print("\n=== Testing Health Check ===")
    test_health_check()
    
    print("\n=== Testing User Registration ===")
    new_user = test_register_user()
    
    print("\n=== Testing Admin Login ===")
    admin_token = test_login()
    
    if admin_token:
        print("\n=== Testing Get Current User ===")
        current_user = test_get_current_user(admin_token)
        
        print("\n=== Testing Schema Creation ===")
        new_schema = test_create_schema(admin_token)
        
        print("\n=== Testing Get All Schemas ===")
        schemas = test_get_schemas(admin_token)
    
    # If we registered a new user, test login with that user
    if new_user:
        print("\n=== Testing New User Login ===")
        new_user_email = new_user.get("email")
        new_user_token = test_login(new_user_email, "Password123!")
        
        if new_user_token:
            print("\n=== Testing New User Get Current User ===")
            new_current_user = test_get_current_user(new_user_token)

if __name__ == "__main__":
    run_all_tests()
