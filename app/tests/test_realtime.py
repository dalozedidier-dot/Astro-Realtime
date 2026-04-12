from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_realtime_positions() -> None:
    payload = {
        'datetime': '2026-04-12T18:20:00Z',
        'lat': 50.8503,
        'lon': 4.3517,
        'elevation_m': 25,
        'zodiac': 'tropical',
        'house_system': 'whole_sign',
        'bodies': ['sun', 'moon', 'mars'],
    }
    response = client.post('/realtime/positions', json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data['meta']['zodiac'] == 'tropical'
    assert len(data['bodies']) == 3
    assert 'asc' in data['angles']
