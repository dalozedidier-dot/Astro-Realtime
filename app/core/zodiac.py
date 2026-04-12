SIGNS = [
    'Aries',
    'Taurus',
    'Gemini',
    'Cancer',
    'Leo',
    'Virgo',
    'Libra',
    'Scorpio',
    'Sagittarius',
    'Capricorn',
    'Aquarius',
    'Pisces',
]


SIDEREAL_OFFSET_DEG = 24.0


def normalize_degrees(value: float) -> float:
    return value % 360.0


def apply_zodiac_mode(longitude: float, zodiac: str) -> float:
    lon = normalize_degrees(longitude)
    if zodiac == 'sidereal':
        lon = normalize_degrees(lon - SIDEREAL_OFFSET_DEG)
    return lon


def sign_from_longitude(longitude: float) -> str:
    index = int(normalize_degrees(longitude) // 30)
    return SIGNS[index]


def sign_degree(longitude: float) -> float:
    return normalize_degrees(longitude) % 30.0
