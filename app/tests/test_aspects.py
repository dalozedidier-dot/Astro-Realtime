from app.core.aspects import detect_aspect


def test_detect_trine() -> None:
    found = detect_aspect(10.0, 130.0)
    assert found is not None
    aspect_name, orb = found
    assert aspect_name == 'trine'
    assert orb == 0.0
