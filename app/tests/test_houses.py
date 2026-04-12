from app.core.houses import build_whole_sign_houses, locate_house


def test_house_location() -> None:
    cusps = build_whole_sign_houses(103.0)
    house = locate_house(110.0, cusps)
    assert house == 1
