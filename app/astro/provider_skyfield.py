from __future__ import annotations

from datetime import datetime, timezone

from skyfield.api import load

from app.astro.models import BodyPosition
from app.astro.provider_base import AstroProvider
from app.core.errors import ProviderError

SKYFIELD_BODY_NAMES = {
    'sun': 'sun',
    'moon': 'moon',
    'mercury': 'mercury',
    'venus': 'venus',
    'mars': 'mars',
    'jupiter': 'jupiter barycenter',
    'saturn': 'saturn barycenter',
    'uranus': 'uranus barycenter',
    'neptune': 'neptune barycenter',
    'pluto': 'pluto barycenter',
}


class SkyfieldProvider(AstroProvider):
    def __init__(self) -> None:
        self.ts = load.timescale()
        try:
            self.eph = load('de421.bsp')
        except Exception as exc:  # pragma: no cover
            raise ProviderError(f'Impossible de charger les éphémérides Skyfield: {exc}') from exc

    def compute_positions(self, dt: datetime, bodies: list[str], lat: float, lon: float) -> list[BodyPosition]:
        dt = dt.astimezone(timezone.utc)
        t = self.ts.from_datetime(dt)
        earth = self.eph['earth']
        positions: list[BodyPosition] = []
        for body in bodies:
            key = SKYFIELD_BODY_NAMES.get(body)
            if not key:
                continue
            target = self.eph[key]
            astrometric = earth.at(t).observe(target).apparent()
            ra, dec, _ = astrometric.radec()
            latlon = astrometric.ecliptic_latlon()
            lon_deg = float(latlon[1].degrees)
            lat_deg = float(latlon[0].degrees)
            positions.append(
                BodyPosition(
                    name=body,
                    longitude=lon_deg,
                    latitude=lat_deg,
                    speed=0.0,
                    retrograde=False,
                    right_ascension=float(ra.hours * 15.0),
                    declination=float(dec.degrees),
                )
            )
        return positions
