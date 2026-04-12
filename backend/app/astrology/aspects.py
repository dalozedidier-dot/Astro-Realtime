from itertools import combinations

ASPECTS = {
    "conjunction": 0,
    "sextile": 60,
    "square": 90,
    "trine": 120,
    "opposition": 180,
}

DEFAULT_ORB = 6.0



def angular_distance(a: float, b: float) -> float:
    diff = abs((a - b) % 360)
    return min(diff, 360 - diff)



def compute_aspects(longitudes: dict[str, float], orb: float = DEFAULT_ORB) -> list[dict[str, float | str]]:
    results: list[dict[str, float | str]] = []

    for body_a, body_b in combinations(sorted(longitudes.keys()), 2):
        distance = angular_distance(longitudes[body_a], longitudes[body_b])
        for aspect_name, exact_angle in ASPECTS.items():
            delta = abs(distance - exact_angle)
            if delta <= orb:
                results.append(
                    {
                        "body_1": body_a,
                        "body_2": body_b,
                        "aspect": aspect_name,
                        "distance_deg": round(distance, 6),
                        "orb_deg": round(delta, 6),
                    }
                )
                break

    return results
