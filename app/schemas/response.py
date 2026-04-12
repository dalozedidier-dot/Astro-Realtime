from datetime import datetime

from pydantic import BaseModel


class MetaOut(BaseModel):
    datetime_utc: datetime
    julian_day_ut: float
    zodiac: str
    house_system: str
    coordinate_frame: str


class LocationOut(BaseModel):
    lat: float
    lon: float
    elevation_m: float


class AngleOut(BaseModel):
    longitude: float
    sign: str
    sign_degree: float


class HouseOut(BaseModel):
    house: int
    longitude: float


class BodyOut(BaseModel):
    name: str
    longitude: float
    latitude: float
    speed: float
    retrograde: bool
    sign: str
    sign_degree: float
    house: int
    right_ascension: float | None = None
    declination: float | None = None


class AspectOut(BaseModel):
    a: str
    b: str
    type: str
    orb: float


class RealtimePositionsResponse(BaseModel):
    meta: MetaOut
    location: LocationOut
    angles: dict[str, AngleOut]
    houses: list[HouseOut]
    bodies: list[BodyOut]
    aspects: list[AspectOut]
