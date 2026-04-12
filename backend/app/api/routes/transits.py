from fastapi import APIRouter, HTTPException

from app.models.request_models import TransitRequest
from app.models.response_models import TransitResponse
from app.services.chart_service import ChartService

router = APIRouter()
service = ChartService()


@router.post("", response_model=TransitResponse)
def calculate_transits(payload: TransitRequest) -> TransitResponse:
    try:
        return service.calculate_transits(payload)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
