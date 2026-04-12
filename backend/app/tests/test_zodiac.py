from app.astrology.zodiac import longitude_to_sign


def test_longitude_to_sign() -> None:
    result = longitude_to_sign(45.5)
    assert result["sign"] == "Taurus"
    assert result["degree_in_sign"] == 15.5
