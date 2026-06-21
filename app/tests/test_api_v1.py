from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_metadata() -> None:
    response = client.get('/api/v1/metadata')
    assert response.status_code == 200
    data = response.json()
    assert data['app_name']
    assert 'sun' in data['supported_bodies']
    assert data['endpoints']['realtime'] == '/api/v1/realtime/positions'


def test_static_index() -> None:
    response = client.get('/')
    assert response.status_code == 200
    assert 'Astro Realtime' in response.text


def test_api_v1_realtime_positions_has_summary() -> None:
    response = client.post(
        '/api/v1/realtime/positions',
        json={
            'datetime': '2026-04-12T18:20:00Z',
            'lat': 50.8503,
            'lon': 4.3517,
            'zodiac': 'tropical',
            'house_system': 'whole_sign',
            'bodies': ['sun', 'moon', 'mars'],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data['meta']['calculation_mode'] == 'realtime'
    assert len(data['bodies']) == 3
    assert 'summary' in data
    assert 'method_notes' in data


def test_natal_chart_endpoint() -> None:
    response = client.post(
        '/api/v1/chart/natal',
        json={
            'name': 'Demo',
            'datetime': '1980-04-15T12:00:00+02:00',
            'lat': 50.8503,
            'lon': 4.3517,
            'zodiac': 'tropical',
            'house_system': 'whole_sign',
            'bodies': ['sun', 'moon', 'mercury', 'mars'],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data['name'] == 'Demo'
    assert data['meta']['calculation_mode'] == 'natal'
    assert len(data['houses']) == 12


def test_transits_endpoint() -> None:
    response = client.post(
        '/api/v1/transits',
        json={
            'name': 'Demo',
            'natal_datetime': '1980-04-15T12:00:00+02:00',
            'transit_datetime': '2026-06-21T18:00:00+02:00',
            'lat': 50.8503,
            'lon': 4.3517,
            'zodiac': 'tropical',
            'house_system': 'whole_sign',
            'bodies': ['sun', 'moon', 'mars'],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data['natal']['meta']['calculation_mode'] == 'natal'
    assert data['transit']['meta']['calculation_mode'] == 'transit'
    assert 'transit_to_natal_aspects' in data
