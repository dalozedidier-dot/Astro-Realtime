from dataclasses import dataclass


@dataclass(slots=True)
class BodyPosition:
    name: str
    longitude: float
    latitude: float
    speed: float
    retrograde: bool
    right_ascension: float | None = None
    declination: float | None = None
