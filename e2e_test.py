import requests

BASE_URL = "http://localhost:8080/api"

print("1. Registering User...")
register_data = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123"
}
try:
    r = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    print("Register Response:", r.status_code, r.text)
except Exception as e:
    print("Register Error:", e)

print("\n2. Logging in...")
login_data = {
    "email": "test@example.com",
    "password": "Password123"
}
token = None
try:
    r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print("Login Response:", r.status_code, r.text)
    if r.status_code == 200:
        token = r.json().get("token")
except Exception as e:
    print("Login Error:", e)

if token:
    print("\n3. Testing GPT AI Service Proxy...")
    headers = {
        "Authorization": f"Bearer {token}"
    }
    gpt_payload = {
        "prompt": "Hello AI, what is 2+2?"
    }
    try:
        r = requests.post(f"{BASE_URL}/ai/gpt", json=gpt_payload, headers=headers)
        print("GPT API Response:", r.status_code, r.text)
    except Exception as e:
        print("GPT Error:", e)
else:
    print("Skipping GPT test since login failed.")
