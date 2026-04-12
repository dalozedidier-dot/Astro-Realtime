from app.astronomy.engine import AstronomyEngine
from app.models.request_models import PositionRequest
from app.models.response_models import PositionResponse


class AstronomyService:
    def __init__(self) -> None:
        self.engine = AstronomyEngine()

    def get_positions(self, payload: PositionRequest) -> PositionResponse:
        data = self.engine.calculate_positions(payload.datetime, payload.bodies)
        return PositionResponse(**data)
