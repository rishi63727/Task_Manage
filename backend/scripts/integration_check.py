"""Quick integration check: backend API + auth + tasks + analytics."""
import sys
import urllib.request
import urllib.error
import json

BASE = "http://127.0.0.1:8000"

def req(method, path, data=None, token=None):
    url = BASE + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=10) as r:
        return r.status, json.loads(r.read().decode()) if r.length else {}

def main():
    ok = True
    # 1. Health
    try:
        status, body = req("GET", "/")
        assert status == 200 and body.get("status") == "ok"
        print("[OK] GET /")
    except Exception as e:
        print("[FAIL] GET /", e)
        return 1

    # 2. Register (use unique email to avoid duplicate)
    import random
    email = f"integration{random.randint(10000,99999)}@test.com"
    try:
        status, body = req("POST", "/api/v1/auth/register", {"email": email, "password": "password123"})
        assert status == 201 and "access_token" in body and "user" in body
        token = body["access_token"]
        print("[OK] POST /api/v1/auth/register")
    except Exception as e:
        print("[FAIL] register", e)
        return 1

    # 3. Login
    try:
        status, body = req("POST", "/api/v1/auth/login", {"email": email, "password": "password123"})
        assert status == 200 and "access_token" in body
        token = body["access_token"]
        print("[OK] POST /api/v1/auth/login")
    except Exception as e:
        print("[FAIL] login", e)
        return 1

    # 4. Get current user (/me - used by frontend)
    try:
        status, body = req("GET", "/me", token=token)
        assert status == 200 and "email" in body
        print("[OK] GET /me")
    except Exception as e:
        print("[FAIL] GET /me", e)
        ok = False

    # 5. List tasks (what frontend Tasks page does)
    try:
        status, body = req("GET", "/api/v1/tasks?limit=10&offset=0", token=token)
        assert status == 200
        assert isinstance(body, list)
        print("[OK] GET /api/v1/tasks")
    except Exception as e:
        print("[FAIL] GET /api/v1/tasks", e)
        ok = False

    # 6. Analytics summary (what frontend Dashboard/Analytics use)
    try:
        status, body = req("GET", "/api/v1/analytics/summary", token=token)
        assert status == 200 and "total" in body and "by_priority" in body
        print("[OK] GET /api/v1/analytics/summary")
    except Exception as e:
        print("[FAIL] GET /api/v1/analytics/summary", e)
        ok = False

    # 7. Create task (what frontend does on Tasks page)
    try:
        status, body = req("POST", "/api/v1/tasks/", {"title": "Integration task", "description": "Test", "priority": "medium"}, token=token)
        assert status == 201 and body.get("title") == "Integration task"
        print("[OK] POST /api/v1/tasks")
    except Exception as e:
        print("[FAIL] POST /api/v1/tasks", e)
        ok = False

    print("\nBackend API integration check:", "PASSED" if ok else "SOME FAILURES")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
