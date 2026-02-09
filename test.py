import requests

# Login
response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    data={"username": "your@email.com", "password": "yourpassword"}
)
token = response.json()["access_token"]

# Try to send 'completed' field
response = requests.put(
    "http://localhost:8000/api/v1/tasks/1",
    json={"completed": True},
    headers={"Authorization": f"Bearer {token}"}
)

print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
