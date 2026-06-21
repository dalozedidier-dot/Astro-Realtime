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

SIGN_GLYPHS = {
    'Aries': '♈',
    'Taurus': '♉',
    'Gemini': '♊',
    'Cancer': '♋',
    'Leo': '♌',
    'Virgo': '♍',
    'Libra': '♎',
    'Scorpio': '♏',
    'Sagittarius': '♐',
    'Capricorn': '♑',
    'Aquarius': '♒',
    'Pisces': '♓',
}

ELEMENT_BY_SIGN = {
    'Aries': 'fire',
    'Leo': 'fire',
    'Sagittarius': 'fire',
    'Taurus': 'earth',
    'Virgo': 'earth',
    'Capricorn': 'earth',
    'Gemini': 'air',
    'Libra': 'air',
    'Aquarius': 'air',
    'Cancer': 'water',
    'Scorpio': 'water',
    'Pisces': 'water',
}

MODALITY_BY_SIGN = {
    'Aries': 'cardinal',
    'Cancer': 'cardinal',
    'Libra': 'cardinal',
    'Capricorn': 'cardinal',
    'Taurus': 'fixed',
    'Leo': 'fixed',
    'Scorpio': 'fixed',
    'Aquarius': 'fixed',
    'Gemini': 'mutable',
    'Virgo': 'mutable',
    'Sagittarius': 'mutable',
    'Pisces': 'mutable',
}

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


def sign_glyph(sign: str) -> str:
    return SIGN_GLYPHS.get(sign, '')


def element_from_sign(sign: str) -> str:
    return ELEMENT_BY_SIGN.get(sign, 'unknown')


def modality_from_sign(sign: str) -> str:
    return MODALITY_BY_SIGN.get(sign, 'unknown')
