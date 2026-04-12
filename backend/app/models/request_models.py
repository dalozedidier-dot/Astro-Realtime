from pydantic import BaseModel, Field, field_validator


DEFAULT_BODIES = [
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
]


class PositionRequest(BaseModel):
    datetime: str = Field(..., description="ISO 8601 datetime with timezone")
    bodies: list[str] = Field(default_factory=lambda: DEFAULT_BODIES.copy())

    @field_validator("bodies")
    @classmethod
    def normalize_bodies(cls, value: list[str]) -> list[str]:
        normalized = [item.lower().strip() for item in value]
        if not normalized:
            raise ValueError("bodies must not be empty")
        return normalized


class ChartRequest(PositionRequest):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class TransitRequest(BaseModel):
    natal_datetime: str = Field(..., description="ISO 8601 datetime with timezone")
    transit_datetime: str = Field(..., description="ISO 8601 datetime with timezone")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    bodies: list[str] = Field(default_factory=lambda: DEFAULT_BODIES.copy())

    @field_validator("bodies")
    @classmethod
    def normalize_bodies(cls, value: list[str]) -> list[str]:
        normalized = [item.lower().strip() for item in value]
        if not normalized:
            raise ValueError("bodies must not be empty")
        return normalized
