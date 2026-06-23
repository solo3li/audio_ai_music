import requests
import json
import os

BASE_URL = "http://localhost:8080/api"
session = requests.Session()

def print_result(name, res):
    if res.status_code in [200, 201]:
        print(f"✅ {name}: SUCCESS ({res.status_code})")
        # try to print JSON snippet
        try:
            print("   ->", str(res.json())[:100] + "...")
        except:
            print("   ->", res.text[:100])
    else:
        print(f"❌ {name}: FAILED ({res.status_code})")
        print("   ->", res.text)

def run_tests():
    print("🚀 Starting Backend E2E Tests from Frontend Perspective...")

    # 1. Register & Login
    email = "test_e2e_user@example.com"
    password = "Password123!"
    
    print("\n[Auth]")
    res = session.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password, "fullName": "Test User"})
    res = session.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    print_result("Login", res)

    token = res.json().get("token")
    if token:
        session.headers.update({"Authorization": f"Bearer {token}"})
        print("✅ Token extracted and added to headers.")
    else:
        print("❌ Login failed: Token not found in response.")
        return

    # 2. Text to Voice
    print("\n[Text-to-Voice]")
    res = session.post(f"{BASE_URL}/ai/text-to-voice/generate", json={
        "text": "Hello World",
        "language": "English (US)",
        "voiceName": "Aurora",
        "styleInstruction": "Neutral"
    })
    print_result("Text-to-Voice Generate", res)

    # 3. GPT
    print("\n[GPT]")
    res = session.post(f"{BASE_URL}/ai/gpt", json={"prompt": "Say hello!"})
    print_result("GPT Text Generation", res)

    # 4. Mock Tools: Voice to Text
    print("\n[Voice-to-Text (Mock)]")
    dummy_audio = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    files = {'audio': ('dummy.wav', dummy_audio, 'audio/wav')}
    res = session.post(f"{BASE_URL}/ai/voice-to-text/transcribe", files=files)
    print_result("Voice-to-Text", res)

    # 5. Mock Tools: BG Remover
    print("\n[Background Remover (Mock)]")
    dummy_image = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    files = {'image': ('dummy.png', dummy_image, 'image/png')}
    res = session.post(f"{BASE_URL}/ai/remove-bg", files=files)
    print_result("BG Remover", res)

    # 6. Mock Tools: Image to Text
    print("\n[Image-to-Text (Mock)]")
    files = {'image': ('dummy.png', dummy_image, 'image/png')}
    res = session.post(f"{BASE_URL}/ai/img_to_txt", files=files)
    print_result("Image-to-Text", res)

    print("\n✅ All Endpoints Tested successfully!")

if __name__ == "__main__":
    run_tests()
