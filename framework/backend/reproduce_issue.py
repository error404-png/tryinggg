import requests
import json

BASE_URL = "http://localhost:8000"

def run_test():
    # 1. Login as Admin to get/create project
    print("Logging in as Admin...")
    resp = requests.post(f"{BASE_URL}/token", data={"username": "admin@example.com", "password": "admin123"})
    if resp.status_code != 200:
        print(f"Admin Login Failed: {resp.text}")
        return
    admin_token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Get Projects
    print("Fetching Projects...")
    resp = requests.get(f"{BASE_URL}/projects", headers=headers)
    projects = resp.json()
    target_project = next((p for p in projects if p["name"] == "Test 3"), None)
    
    if not target_project:
        print("Project 'Test 3' not found.")
        return
    
    print(f"Target Project: {target_project['name']} ({target_project['_id']})")
    print(f"Project Agents: {target_project.get('agents', [])}")

    # 2. Login as Standard User
    # Assuming user@test.com exists from previous steps, otherwise creating
    print("Logging in as User (basic)...")
    try:
        resp = requests.post(f"{BASE_URL}/token", data={"username": "user@test.com", "password": "user123"})
        if resp.status_code != 200:
             # Try creating if not exists (Admin action)
             print("User login failed, creating user...")
             requests.post(f"{BASE_URL}/users", json={"email": "user@test.com", "password": "user123", "role": "user", "allowed_projects": [target_project["_id"]]}, headers=headers)
             resp = requests.post(f"{BASE_URL}/token", data={"username": "user@test.com", "password": "user123"})
    except Exception as e:
        print(e)
        
    if resp.status_code != 200:
        print(f"User Login Failed: {resp.text}")
        return
        
    user_token = resp.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}
    
    # Force update access
    print("Updating user access...")
    # Ideally we'd use a PUT endpoint but for now let's assume the user creation set it or we can hack it via DB script if needed.
    # Actually, let's just make sure we are testing with a user that has access.
    # We can try to update the user via admin endpoint if it exists, or just use python to update DB.
    pass
    
    # 3. Send Chat Request (Empty Chain, simulating frontend)
    print("Sending Chat Request as User...")
    chat_payload = {
        "query": "hello world",
        "chain": []
    }
    
    resp = requests.post(f"{BASE_URL}/projects/{target_project['_id']}/chat", json=chat_payload, headers=user_headers)
    
    print(f"Response Status: {resp.status_code}")
    print(f"Response Body: {json.dumps(resp.json(), indent=2)}")

if __name__ == "__main__":
    run_test()
