from pydantic import BaseModel


class BodyPosition(BaseModel):
    longitude_deg: float
    latitude_deg: float
    distance_au: float
    right_ascension_hours: float
    declination_deg: float


class PositionResponse(BaseModel):
    timestamp_utc: str
    positions: dict[str, BodyPosition]


class Placement(BaseModel):
    longitude_deg: float
    latitude_deg: float
    sign: str
    degree_in_sign: float
    house: int


class AspectModel(BaseModel):
    body_1: str
    body_2: str
    aspect: str
    distance_deg: float
    orb_deg: float


class NatalChartResponse(BaseModel):
    timestamp_utc: str
    observer: dict[str, float]
    angles: dict[str, float]
    placements: dict[str, Placement]
    aspects: list[AspectModel]
    notes: list[str]


class TransitAspectModel(BaseModel):
    transit_body: str
    natal_body: str
    aspect: str
    distance_deg: float
    orb_deg: float


class TransitResponse(BaseModel):
    natal_timestamp_utc: str
    transit_timestamp_utc: str
    observer: dict[str, float]
    transit_positions: dict[str, BodyPosition]
    transit_to_natal_aspects: list[TransitAspectModel]
    notes: list[str]
