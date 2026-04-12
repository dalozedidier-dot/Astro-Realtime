from fastapi import APIRouter, HTTPException

from app.models.request_models import ChartRequest
from app.models.response_models import NatalChartResponse
from app.services.chart_service import ChartService

router = APIRouter()
service = ChartService()


@router.post("/natal", response_model=NatalChartResponse)
def build_natal_chart(payload: ChartRequest) -> NatalChartResponse:
    try:
        return service.build_natal_chart(payload)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
