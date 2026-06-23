import os

services_dir = "/root/nexmedia/nexclone/services"

for service_name in os.listdir(services_dir):
    service_path = os.path.join(services_dir, service_name)
    dockerfile_path = os.path.join(service_path, "Dockerfile")
    
    if os.path.isdir(service_path) and os.path.exists(dockerfile_path):
        with open(dockerfile_path, "r") as f:
            content = f.read()
            
        # Replace occurrences like COPY services/gpt /app with COPY . /app
        # And COPY services/gpt/requirements.txt . with COPY requirements.txt .
        content = content.replace(f"services/{service_name}/requirements.txt", "requirements.txt")
        content = content.replace(f"services/{service_name}", ".")
        
        with open(dockerfile_path, "w") as f:
            f.write(content)
        
        print(f"Fixed {dockerfile_path}")
