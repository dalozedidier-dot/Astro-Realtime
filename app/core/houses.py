from typing import List

from app.core.zodiac import normalize_degrees


def approximate_ascendant_deg(local_sidereal_time_deg: float, latitude_deg: float) -> float:
    correction = latitude_deg * 0.2
    return normalize_degrees(local_sidereal_time_deg + 90.0 - correction)


def approximate_mc_deg(local_sidereal_time_deg: float) -> float:
    return normalize_degrees(local_sidereal_time_deg)


def build_whole_sign_houses(ascendant_deg: float) -> List[float]:
    start = int(ascendant_deg // 30) * 30.0
    return [normalize_degrees(start + i * 30.0) for i in range(12)]


def build_equal_houses(ascendant_deg: float) -> List[float]:
    return [normalize_degrees(ascendant_deg + i * 30.0) for i in range(12)]


def locate_house(longitude: float, house_cusps: list[float]) -> int:
    lon = normalize_degrees(longitude)
    for idx in range(12):
        start = house_cusps[idx]
        end = house_cusps[(idx + 1) % 12]
        if start < end:
            if start <= lon < end:
                return idx + 1
        else:
            if lon >= start or lon < end:
                return idx + 1
    return 12
