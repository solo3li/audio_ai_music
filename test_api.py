import requests

url = "http://localhost:8080/api/video-editor/voice-swap"

# Create a dummy audio file
with open("dummy.mp3", "wb") as f:
    f.write(b"ID3\x03\x00\x00\x00\x00\x00\x00")

with open("dummy.mp3", "rb") as f:
    files = {"file": ("dummy.mp3", f, "audio/mpeg")}
    data = {"voiceId": "1", "emotion": "1"}
    response = requests.post(url, files=files, data=data)

print(response.status_code)
print(response.text)
