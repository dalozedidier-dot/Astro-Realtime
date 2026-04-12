from __future__ import annotations

from datetime import datetime

from app.astro.models import BodyPosition
from app.astro.provider_base import AstroProvider
from app.core.time import julian_day
from app.core.zodiac import normalize_degrees

BODY_PARAMS = {
    'sun': {'base': 280.0, 'rate': 0.98564736, 'lat_amp': 0.0},
    'moon': {'base': 218.3, 'rate': 13.176358, 'lat_amp': 5.1},
    'mercury': {'base': 60.0, 'rate': 4.09233445, 'lat_amp': 2.0},
    'venus': {'base': 90.0, 'rate': 1.60213034, 'lat_amp': 1.5},
    'mars': {'base': 120.0, 'rate': 0.52402068, 'lat_amp': 1.8},
    'jupiter': {'base': 150.0, 'rate': 0.08308529, 'lat_amp': 1.3},
    'saturn': {'base': 180.0, 'rate': 0.03344414, 'lat_amp': 1.0},
    'uranus': {'base': 210.0, 'rate': 0.01172834, 'lat_amp': 0.8},
    'neptune': {'base': 240.0, 'rate': 0.00598103, 'lat_amp': 0.7},
    'pluto': {'base': 270.0, 'rate': 0.003964, 'lat_amp': 0.6},
}


class BuiltinProvider(AstroProvider):
    def compute_positions(self, dt: datetime, bodies: list[str], lat: float, lon: float) -> list[BodyPosition]:
        jd = julian_day(dt)
        d = jd - 2451545.0
        positions: list[BodyPosition] = []
        for body in bodies:
            params = BODY_PARAMS.get(body)
            if not params:
                continue
            longitude = normalize_degrees(params['base'] + params['rate'] * d)
            latitude = params['lat_amp'] * __import__('math').sin(__import__('math').radians(longitude))
            speed = params['rate']
            retrograde = False
            right_ascension = normalize_degrees(longitude - 1.2)
            declination = latitude * 0.85
            positions.append(
                BodyPosition(
                    name=body,
                    longitude=longitude,
                    latitude=latitude,
                    speed=speed,
                    retrograde=retrograde,
                    right_ascension=right_ascension,
                    declination=declination,
                )
            )
        return positions
