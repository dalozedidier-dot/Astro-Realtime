SIGNS = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
]


def longitude_to_sign(longitude_deg: float) -> dict[str, float | str | int]:
    normalized = longitude_deg % 360.0
    sign_index = int(normalized // 30)
    degree_in_sign = normalized % 30
    return {
        "sign": SIGNS[sign_index],
        "sign_index": sign_index,
        "degree_in_sign": round(degree_in_sign, 6),
    }
