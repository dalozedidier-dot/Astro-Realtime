from fastapi import APIRouter, HTTPException

from app.models.request_models import PositionRequest
from app.models.response_models import PositionResponse
from app.services.astronomy_service import AstronomyService

router = APIRouter()
service = AstronomyService()


@router.post("", response_model=PositionResponse)
def calculate_positions(payload: PositionRequest) -> PositionResponse:
    try:
        return service.get_positions(payload)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
