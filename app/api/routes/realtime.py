from fastapi import APIRouter, HTTPException

from app.schemas.request import RealtimePositionsRequest
from app.schemas.response import RealtimePositionsResponse
from app.services.realtime_service import RealtimeService

router = APIRouter(tags=['realtime'])
service = RealtimeService()


@router.post('/realtime/positions', response_model=RealtimePositionsResponse)
def realtime_positions(payload: RealtimePositionsRequest) -> RealtimePositionsResponse:
    try:
        return service.get_positions(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
