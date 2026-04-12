from skyfield.api import wgs84

from app.astronomy.engine import AstronomyEngine
from app.astronomy.time_utils import parse_iso_datetime
from app.astrology.aspects import compute_aspects
from app.astrology.houses import whole_sign_house_from_longitude
from app.astrology.zodiac import longitude_to_sign


class ChartBuilder:
    def __init__(self) -> None:
        self.engine = AstronomyEngine()

    def _compute_ascendant_approx(self, dt_iso: str, latitude: float, longitude: float) -> float:
        dt_utc = parse_iso_datetime(dt_iso)
        t = self.engine.ts.from_datetime(dt_utc)
        _ = self.engine.earth + wgs84.latlon(latitude_degrees=latitude, longitude_degrees=longitude)
        gmst_hours = t.gmst
        local_sidereal_hours = (gmst_hours + longitude / 15.0) % 24.0
        return (local_sidereal_hours * 15.0) % 360.0

    def build_natal_chart(self, dt_iso: str, latitude: float, longitude: float, bodies: list[str] | None = None) -> dict:
        raw = self.engine.calculate_positions(dt_iso, bodies)
        ascendant_deg = self._compute_ascendant_approx(dt_iso, latitude, longitude)

        placements = {}
        longitudes = {}
        for body, data in raw["positions"].items():
            lon = float(data["longitude_deg"])
            longitudes[body] = lon
            sign_data = longitude_to_sign(lon)
            placements[body] = {
                "longitude_deg": lon,
                "latitude_deg": data["latitude_deg"],
                "sign": sign_data["sign"],
                "degree_in_sign": sign_data["degree_in_sign"],
                "house": whole_sign_house_from_longitude(ascendant_deg, lon),
            }

        aspects = compute_aspects(longitudes)

        return {
            "timestamp_utc": raw["timestamp_utc"],
            "observer": {
                "latitude": latitude,
                "longitude": longitude,
            },
            "angles": {
                "ascendant_deg_approx": round(ascendant_deg, 6),
            },
            "placements": placements,
            "aspects": aspects,
            "notes": [
                "House calculation uses a whole-sign system.",
                "Ascendant is an initial approximation based on local sidereal time and should be refined in a later version.",
            ],
        }

    def calculate_transits(
        self,
        natal_dt_iso: str,
        transit_dt_iso: str,
        latitude: float,
        longitude: float,
        bodies: list[str] | None = None,
    ) -> dict:
        natal_chart = self.build_natal_chart(natal_dt_iso, latitude, longitude, bodies)
        transit_positions = self.engine.calculate_positions(transit_dt_iso, bodies)

        natal_longitudes = {body: data["longitude_deg"] for body, data in natal_chart["placements"].items()}
        transit_longitudes = {body: data["longitude_deg"] for body, data in transit_positions["positions"].items()}

        cross_aspects = []
        from app.astrology.aspects import ASPECTS, angular_distance, DEFAULT_ORB

        for transit_body, transit_lon in transit_longitudes.items():
            for natal_body, natal_lon in natal_longitudes.items():
                distance = angular_distance(float(transit_lon), float(natal_lon))
                for aspect_name, exact in ASPECTS.items():
                    orb = abs(distance - exact)
                    if orb <= DEFAULT_ORB:
                        cross_aspects.append(
                            {
                                "transit_body": transit_body,
                                "natal_body": natal_body,
                                "aspect": aspect_name,
                                "distance_deg": round(distance, 6),
                                "orb_deg": round(orb, 6),
                            }
                        )
                        break

        return {
            "natal_timestamp_utc": natal_chart["timestamp_utc"],
            "transit_timestamp_utc": transit_positions["timestamp_utc"],
            "observer": {
                "latitude": latitude,
                "longitude": longitude,
            },
            "transit_positions": transit_positions["positions"],
            "transit_to_natal_aspects": cross_aspects,
            "notes": natal_chart["notes"],
        }
