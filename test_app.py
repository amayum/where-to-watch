import pytest
from app import app

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "alive"

def test_search_missing_param(client):
    res = client.get("/api/search")
    assert res.status_code == 400

def test_search_returns_suggestions(client):
    res = client.get("/api/search?movie=inception")
    assert res.status_code == 200
    data = res.get_json()
    assert "suggestions" in data
    assert len(data["suggestions"]) > 0

def test_streaming_missing_id(client):
    res = client.get("/api/streaming/by-id")
    assert res.status_code == 400

def test_recommendations_missing_id(client):
    res = client.get("/api/recommendations")
    assert res.status_code == 400
