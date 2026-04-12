from app.core.zodiac import normalize_degrees


def validate_longitude(value: float) -> float:
    return normalize_degrees(value)
