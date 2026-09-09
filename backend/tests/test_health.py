from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)
def test_root(): assert client.get("/").status_code==200
def test_health():
    r=client.get("/api/system/health"); assert r.status_code==200 and r.json()["status"]=="healthy"
