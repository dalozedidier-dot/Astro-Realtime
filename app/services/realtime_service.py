from __future__ import annotations

from app.astro.engine import AstroEngine
from app.config import settings
from app.core.aspects import ASPECT_NATURE, detect_aspect, smallest_angular_distance
from app.core.cache import cache
from app.core.coords import longitude_to_local_sidereal_time_deg
from app.core.houses import (
    approximate_ascendant_deg,
    approximate_mc_deg,
    build_equal_houses,
    build_whole_sign_houses,
    locate_house,
)
from app.core.interpretation import build_chart_summary, build_interpretation, build_method_notes
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

    def get_positions(
        self,
        payload: RealtimePositionsRequest,
        *,
        calculation_mode: str = 'realtime',
    ) -> RealtimePositionsResponse:
        dt = ensure_utc(payload.datetime)
        cache_key = (
            calculation_mode,
            dt.isoformat(),
            round(payload.lat, 6),
            round(payload.lon, 6),
            payload.elevation_m,
            payload.zodiac.value if hasattr(payload.zodiac, 'value') else str(payload.zodiac),
            payload.house_system.value if hasattr(payload.house_system, 'value') else str(payload.house_system),
            tuple(payload.bodies),
            settings.astro_engine,
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
            lon = apply_zodiac_mode(body.longitude, payload.zodiac.value if hasattr(payload.zodiac, 'value') else str(payload.zodiac))
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

        aspects = self._compute_aspects(body_out)
        summary = build_chart_summary(body_out)
        interpretation = build_interpretation(body_out, aspects)
        method_notes = build_method_notes(settings.astro_engine, str(payload.house_system.value), str(payload.zodiac.value))

        response = RealtimePositionsResponse(
            meta=MetaOut(
                datetime_utc=dt,
                julian_day_ut=round(jd, 8),
                zodiac=payload.zodiac.value,
                house_system=payload.house_system.value,
                coordinate_frame='geocentric',
                calculation_mode=calculation_mode,
                engine=settings.astro_engine,
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
            houses=[
                HouseOut(house=i + 1, longitude=round(cusp, 6), sign=sign_from_longitude(cusp))
                for i, cusp in enumerate(house_cusps)
            ],
            bodies=body_out,
            aspects=aspects,
            summary=summary,
            interpretation=interpretation,
            method_notes=method_notes,
        )
        cache[cache_key] = response
        return response

    @staticmethod
    def _compute_aspects(bodies: list[BodyOut]) -> list[AspectOut]:
        aspects: list[AspectOut] = []
        for i in range(len(bodies)):
            for j in range(i + 1, len(bodies)):
                found = detect_aspect(bodies[i].longitude, bodies[j].longitude)
                if found is None:
                    continue
                aspect_name, orb = found
                aspects.append(
                    AspectOut(
                        a=bodies[i].name,
                        b=bodies[j].name,
                        type=aspect_name,
                        orb=round(orb, 6),
                        distance=round(smallest_angular_distance(bodies[i].longitude, bodies[j].longitude), 6),
                        nature=ASPECT_NATURE.get(aspect_name),
                    )
                )
        return sorted(aspects, key=lambda aspect: aspect.orb)
