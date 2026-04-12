from app.core.enums import AspectType
from app.core.zodiac import normalize_degrees

ASPECT_ANGLES = {
    AspectType.conjunction.value: 0.0,
    AspectType.sextile.value: 60.0,
    AspectType.square.value: 90.0,
    AspectType.trine.value: 120.0,
    AspectType.opposition.value: 180.0,
}

DEFAULT_ORBS = {
    AspectType.conjunction.value: 8.0,
    AspectType.sextile.value: 4.0,
    AspectType.square.value: 6.0,
    AspectType.trine.value: 6.0,
    AspectType.opposition.value: 8.0,
}


def smallest_angular_distance(a: float, b: float) -> float:
    diff = abs(normalize_degrees(a) - normalize_degrees(b))
    return min(diff, 360.0 - diff)


def detect_aspect(a: float, b: float) -> tuple[str, float] | None:
    distance = smallest_angular_distance(a, b)
    for aspect_name, exact in ASPECT_ANGLES.items():
        orb = abs(distance - exact)
        if orb <= DEFAULT_ORBS[aspect_name]:
            return aspect_name, orb
    return None
