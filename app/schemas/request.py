from datetime import datetime as DateTime

from pydantic import BaseModel, Field, field_validator, model_validator

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

SUPPORTED_BODIES = set(DEFAULT_BODIES)


class AstroBaseRequest(BaseModel):
    lat: float = Field(ge=-90.0, le=90.0, description='Latitude décimale de l’observateur.')
    lon: float = Field(ge=-180.0, le=180.0, description='Longitude décimale de l’observateur.')
    elevation_m: float = Field(default=0.0, description='Altitude en mètres. Conservée pour extension future.')
    zodiac: ZodiacType = ZodiacType.tropical
    house_system: HouseSystem = HouseSystem.whole_sign
    bodies: list[str] = Field(default_factory=lambda: DEFAULT_BODIES.copy())

    @field_validator('bodies')
    @classmethod
    def validate_bodies(cls, values: list[str]) -> list[str]:
        normalized = [value.strip().lower() for value in values if value and value.strip()]
        if not normalized:
            raise ValueError('La liste des corps ne peut pas être vide.')
        unsupported = sorted(set(normalized) - SUPPORTED_BODIES)
        if unsupported:
            raise ValueError(f"Corps non supportés: {', '.join(unsupported)}")
        return list(dict.fromkeys(normalized))


class RealtimePositionsRequest(AstroBaseRequest):
    datetime: DateTime | None = Field(default=None, description='Date ISO 8601. Si absent, l’API utilise maintenant en UTC.')


class NatalChartRequest(AstroBaseRequest):
    datetime: DateTime = Field(..., description='Date et heure de naissance ISO 8601 avec timezone si possible.')
    name: str | None = Field(default=None, max_length=120)


class TransitRequest(AstroBaseRequest):
    natal_datetime: DateTime = Field(..., description='Date natale ISO 8601.')
    transit_datetime: DateTime | None = Field(default=None, description='Date de transit. Si absent, maintenant en UTC.')
    name: str | None = Field(default=None, max_length=120)

    @model_validator(mode='after')
    def ensure_distinct_dates(self) -> 'TransitRequest':
        if self.transit_datetime and self.transit_datetime == self.natal_datetime:
            raise ValueError('La date de transit doit être différente de la date natale.')
        return self
