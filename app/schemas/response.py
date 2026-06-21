from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class MetaOut(BaseModel):
    datetime_utc: datetime
    julian_day_ut: float
    zodiac: str
    house_system: str
    coordinate_frame: str
    calculation_mode: str = 'realtime'
    engine: str = 'builtin'


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
    sign: str | None = None


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
    distance: float | None = None
    nature: str | None = None


class InterpretationItem(BaseModel):
    kind: str
    title: str
    text: str
    weight: float = 1.0
    nature: str | None = None


class RealtimePositionsResponse(BaseModel):
    meta: MetaOut
    location: LocationOut
    angles: dict[str, AngleOut]
    houses: list[HouseOut]
    bodies: list[BodyOut]
    aspects: list[AspectOut]
    summary: dict[str, Any] = Field(default_factory=dict)
    interpretation: list[InterpretationItem] = Field(default_factory=list)
    method_notes: list[str] = Field(default_factory=list)


class NatalChartResponse(RealtimePositionsResponse):
    name: str | None = None


class TransitAspectOut(BaseModel):
    transit_body: str
    natal_body: str
    type: str
    orb: float
    distance: float
    nature: str | None = None


class TransitResponse(BaseModel):
    name: str | None = None
    natal: NatalChartResponse
    transit: RealtimePositionsResponse
    transit_to_natal_aspects: list[TransitAspectOut]
    interpretation: list[InterpretationItem] = Field(default_factory=list)
    method_notes: list[str] = Field(default_factory=list)


class MetadataResponse(BaseModel):
    app_name: str
    app_version: str
    engine: str
    supported_bodies: list[str]
    zodiac_modes: list[str]
    house_systems: list[str]
    endpoints: dict[str, str]
    precision_notes: list[str]
