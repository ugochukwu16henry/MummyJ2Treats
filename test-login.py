import requests

API_BASE = "https://mummyj2treatsbackend-production.up.railway.app"

# Test user details
user = {
    "email": "testuser@example.com",
    "password": "TestPassword123",
    "firstName": "Test",
    "lastName": "User",
    "phone": "1234567890"
}

# Register user
register_url = f"{API_BASE}/auth/register/customer"
register_resp = requests.post(register_url, json=user)
print("Register response:", register_resp.status_code, register_resp.text)

# Login user
login_url = f"{API_BASE}/auth/login"
login_data = {"email": user["email"], "password": user["password"]}
login_resp = requests.post(login_url, json=login_data)
print("Login response:", login_resp.status_code, login_resp.text)
