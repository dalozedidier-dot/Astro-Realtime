from __future__ import annotations

from app.astro.engine import AstroEngine
from app.core.aspects import detect_aspect
from app.core.cache import cache
from app.core.coords import longitude_to_local_sidereal_time_deg
from app.core.houses import (
    approximate_ascendant_deg,
    approximate_mc_deg,
    build_equal_houses,
    build_whole_sign_houses,
    locate_house,
)
from app.core.time import ensure_utc, julian_day
from app.core.zodiac import apply_zodiac_mode, sign_degree, sign_from_longitude
from app.schemas.request import RealtimePositionsRequest
from app.schemas.response import (
    AngleOut,
    AspectOut,
    BodyOut,
    HouseOut,
    LocationOut,
    MetaOut,
    RealtimePositionsResponse,
)


class RealtimeService:
    def __init__(self) -> None:
        self.engine = AstroEngine()

    def get_positions(self, payload: RealtimePositionsRequest) -> RealtimePositionsResponse:
        dt = ensure_utc(payload.datetime)
        cache_key = (
            dt.isoformat(),
            round(payload.lat, 6),
            round(payload.lon, 6),
            payload.zodiac,
            payload.house_system,
            tuple(payload.bodies),
        )
        if cache_key in cache:
            return cache[cache_key]

        jd = julian_day(dt)
        lst = longitude_to_local_sidereal_time_deg(jd, payload.lon)
        asc = approximate_ascendant_deg(lst, payload.lat)
        mc = approximate_mc_deg(lst)

        if payload.house_system == 'equal':
            house_cusps = build_equal_houses(asc)
        else:
            house_cusps = build_whole_sign_houses(asc)

        positions = self.engine.provider.compute_positions(dt, payload.bodies, payload.lat, payload.lon)

        body_out: list[BodyOut] = []
        for body in positions:
            lon = apply_zodiac_mode(body.longitude, payload.zodiac)
            house = locate_house(lon, house_cusps)
            body_out.append(
                BodyOut(
                    name=body.name,
                    longitude=round(lon, 6),
                    latitude=round(body.latitude, 6),
                    speed=round(body.speed, 6),
                    retrograde=body.retrograde,
                    sign=sign_from_longitude(lon),
                    sign_degree=round(sign_degree(lon), 6),
                    house=house,
                    right_ascension=round(body.right_ascension, 6) if body.right_ascension is not None else None,
                    declination=round(body.declination, 6) if body.declination is not None else None,
                )
            )

        aspects: list[AspectOut] = []
        for i in range(len(body_out)):
            for j in range(i + 1, len(body_out)):
                found = detect_aspect(body_out[i].longitude, body_out[j].longitude)
                if found is None:
                    continue
                aspect_name, orb = found
                aspects.append(
                    AspectOut(
                        a=body_out[i].name,
                        b=body_out[j].name,
                        type=aspect_name,
                        orb=round(orb, 6),
                    )
                )

        response = RealtimePositionsResponse(
            meta=MetaOut(
                datetime_utc=dt,
                julian_day_ut=round(jd, 8),
                zodiac=payload.zodiac,
                house_system=payload.house_system,
                coordinate_frame='geocentric',
            ),
            location=LocationOut(
                lat=payload.lat,
                lon=payload.lon,
                elevation_m=payload.elevation_m,
            ),
            angles={
                'asc': AngleOut(
                    longitude=round(asc, 6),
                    sign=sign_from_longitude(asc),
                    sign_degree=round(sign_degree(asc), 6),
                ),
                'mc': AngleOut(
                    longitude=round(mc, 6),
                    sign=sign_from_longitude(mc),
                    sign_degree=round(sign_degree(mc), 6),
                ),
            },
            houses=[HouseOut(house=i + 1, longitude=round(cusp, 6)) for i, cusp in enumerate(house_cusps)],
            bodies=body_out,
            aspects=aspects,
        )
        cache[cache_key] = response
        return response
