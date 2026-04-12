from app.astrology.aspects import compute_aspects


def test_compute_aspects_detects_trine() -> None:
    longitudes = {"sun": 10.0, "moon": 130.0}
    aspects = compute_aspects(longitudes)
    assert any(item["aspect"] == "trine" for item in aspects)
