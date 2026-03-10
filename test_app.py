import pytest
from app import app

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


# tests that the API is up and running
def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "alive"


# tests that searching without a movie name returns an error
def test_search_missing_param(client):
    res = client.get("/api/search")
    assert res.status_code == 400


# tests that searching for real movie returns a result
def test_search_returns_suggestions(client):
    res = client.get("/api/search?movie=inception")
    assert res.status_code == 200
    data = res.get_json()
    assert "suggestions" in data
    assert len(data["suggestions"]) > 0


# tests that searching for streaming info without a movie returns an error
def test_streaming_missing_id(client):
    res = client.get("/api/streaming/by-id")
    assert res.status_code == 400


# tests that asking for recommendations without a movie returns an error
def test_recommendations_missing_id(client):
    res = client.get("/api/recommendations")
    assert res.status_code == 400
