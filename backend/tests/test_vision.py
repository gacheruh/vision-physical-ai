from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_summary():
    res = client.get("/api/v1/vision/summary")
    assert res.status_code == 200
    assert res.json()["status"] == "success"
    assert "total_frames_processed" in res.json()
