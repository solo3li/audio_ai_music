import requests

BASE_URL = "http://localhost:8080/api"

print("1. Logging in...")
login_data = {
    "email": "test@example.com",
    "password": "Password123"
}
r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
token = r.json().get("token")

if token:
    print("\n2. Testing BG Remover Mock API...")
    headers = {
        "Authorization": f"Bearer {token}"
    }
    # Create a dummy text file to act as an image for testing
    files = {'image': ('test.png', b'dummy_image_data', 'image/png')}
    
    try:
        r = requests.post(f"{BASE_URL}/ai/remove-bg", files=files, headers=headers)
        print("BG Remover Response Code:", r.status_code)
        if r.status_code == 200:
            print("Successfully returned dummy file of length:", len(r.content))
        else:
            print("Error:", r.text)
    except Exception as e:
        print("BG Remover Error:", e)
else:
    print("Login Failed")
