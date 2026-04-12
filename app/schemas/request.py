from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.core.enums import HouseSystem, ZodiacType

DEFAULT_BODIES = [
    'sun',
    'moon',
    'mercury',
    'venus',
    'mars',
    'jupiter',
    'saturn',
    'uranus',
    'neptune',
    'pluto',
]


class RealtimePositionsRequest(BaseModel):
    datetime: datetime
    lat: float = Field(ge=-90.0, le=90.0)
    lon: float = Field(ge=-180.0, le=180.0)
    elevation_m: float = 0.0
    zodiac: ZodiacType = ZodiacType.tropical
    house_system: HouseSystem = HouseSystem.whole_sign
    bodies: list[str] = Field(default_factory=lambda: DEFAULT_BODIES.copy())

    @field_validator('bodies')
    @classmethod
    def validate_bodies(cls, values: list[str]) -> list[str]:
        normalized = [value.strip().lower() for value in values if value.strip()]
        if not normalized:
            raise ValueError('La liste des corps ne peut pas être vide.')
        return normalized
