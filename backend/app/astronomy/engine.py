from typing import Any

from app.astronomy.ephemeris_loader import EphemerisLoader
from app.astronomy.time_utils import parse_iso_datetime

BODY_MAP = {
    "sun": "sun",
    "moon": "moon",
    "mercury": "mercury",
    "venus": "venus",
    "mars": "mars",
    "jupiter": "jupiter barycenter",
    "saturn": "saturn barycenter",
    "uranus": "uranus barycenter",
    "neptune": "neptune barycenter",
    "pluto": "pluto barycenter",
}


class AstronomyEngine:
    def __init__(self) -> None:
        self.loader = EphemerisLoader()
        self.ts = self.loader.load_timescale()
        self.eph = self.loader.load_ephemeris()
        self.earth = self.eph["earth"]

    def calculate_positions(
        self,
        dt_iso: str,
        bodies: list[str] | None = None,
    ) -> dict[str, Any]:
        dt_utc = parse_iso_datetime(dt_iso)
        t = self.ts.from_datetime(dt_utc)

        requested = bodies or list(BODY_MAP.keys())
        positions: dict[str, Any] = {}

        for body in requested:
            key = body.lower()
            if key not in BODY_MAP:
                raise ValueError(f"Unsupported body: {body}")

            target = self.eph[BODY_MAP[key]]
            astrometric = self.earth.at(t).observe(target).apparent()
            ecliptic_lat, ecliptic_lon, distance = astrometric.ecliptic_latlon()
            ra, dec, _ = astrometric.radec()

            positions[key] = {
                "longitude_deg": round(ecliptic_lon.degrees % 360, 6),
                "latitude_deg": round(ecliptic_lat.degrees, 6),
                "distance_au": round(distance.au, 9),
                "right_ascension_hours": round(ra.hours, 6),
                "declination_deg": round(dec.degrees, 6),
            }

        return {
            "timestamp_utc": dt_utc.isoformat(),
            "positions": positions,
        }
