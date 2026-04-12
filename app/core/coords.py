from app.core.zodiac import normalize_degrees


def longitude_to_local_sidereal_time_deg(julian_day_ut: float, lon_deg: float) -> float:
    t = (julian_day_ut - 2451545.0) / 36525.0
    gmst = (
        280.46061837
        + 360.98564736629 * (julian_day_ut - 2451545.0)
        + 0.000387933 * t * t
        - (t * t * t) / 38710000.0
    )
    return normalize_degrees(gmst + lon_deg)
