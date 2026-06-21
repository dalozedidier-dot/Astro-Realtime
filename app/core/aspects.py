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

ASPECT_NATURE = {
    AspectType.conjunction.value: 'fusion',
    AspectType.sextile.value: 'opportunity',
    AspectType.square.value: 'tension',
    AspectType.trine.value: 'flow',
    AspectType.opposition.value: 'polarity',
}

ASPECT_LABELS_FR = {
    AspectType.conjunction.value: 'Conjonction',
    AspectType.sextile.value: 'Sextile',
    AspectType.square.value: 'Carré',
    AspectType.trine.value: 'Trigone',
    AspectType.opposition.value: 'Opposition',
}


def smallest_angular_distance(a: float, b: float) -> float:
    diff = abs(normalize_degrees(a) - normalize_degrees(b))
    return min(diff, 360.0 - diff)


def detect_aspect(a: float, b: float, *, orbs: dict[str, float] | None = None) -> tuple[str, float] | None:
    distance = smallest_angular_distance(a, b)
    active_orbs = orbs or DEFAULT_ORBS
    candidates: list[tuple[str, float]] = []
    for aspect_name, exact in ASPECT_ANGLES.items():
        orb = abs(distance - exact)
        if orb <= active_orbs[aspect_name]:
            candidates.append((aspect_name, orb))
    if not candidates:
        return None
    return min(candidates, key=lambda item: item[1])
