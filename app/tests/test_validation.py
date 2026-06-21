from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_rejects_unknown_body() -> None:
    response = client.post(
        '/api/v1/realtime/positions',
        json={
            'datetime': '2026-04-12T18:20:00Z',
            'lat': 50.8503,
            'lon': 4.3517,
            'bodies': ['sun', 'ceres'],
        },
    )
    assert response.status_code == 422
