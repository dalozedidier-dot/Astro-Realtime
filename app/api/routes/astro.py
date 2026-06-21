from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.core.enums import HouseSystem, ZodiacType
from app.schemas.request import DEFAULT_BODIES, NatalChartRequest, RealtimePositionsRequest, TransitRequest
from app.schemas.response import MetadataResponse, NatalChartResponse, RealtimePositionsResponse, TransitResponse
from app.services.chart_service import ChartService
from app.services.realtime_service import RealtimeService

router = APIRouter(prefix='/api/v1', tags=['astro'])
realtime_service = RealtimeService()
chart_service = ChartService()


@router.get('/metadata', response_model=MetadataResponse)
def metadata() -> MetadataResponse:
    return MetadataResponse(
        app_name=settings.app_name,
        app_version=settings.app_version,
        engine=settings.astro_engine,
        supported_bodies=DEFAULT_BODIES,
        zodiac_modes=[mode.value for mode in ZodiacType],
        house_systems=[system.value for system in HouseSystem],
        endpoints={
            'health': '/health',
            'metadata': '/api/v1/metadata',
            'realtime': '/api/v1/realtime/positions',
            'natal_chart': '/api/v1/chart/natal',
            'transits': '/api/v1/transits',
            'legacy_realtime': '/realtime/positions',
            'docs': '/docs',
        },
        precision_notes=[
            'Le mode builtin est autonome et déterministe, utile pour l’interface et les tests.',
            'Le mode Skyfield peut être activé avec ASTRO_ENGINE=skyfield et des éphémérides disponibles.',
            'Les maisons et angles restent approximatifs dans cette étape. L’interface l’indique explicitement.',
        ],
    )


@router.get('/now')
def now() -> dict[str, str]:
    return {'datetime_utc': datetime.now(timezone.utc).isoformat()}


@router.post('/realtime/positions', response_model=RealtimePositionsResponse)
def realtime_positions(payload: RealtimePositionsRequest) -> RealtimePositionsResponse:
    try:
        return realtime_service.get_positions(payload, calculation_mode='realtime')
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post('/chart/natal', response_model=NatalChartResponse)
def natal_chart(payload: NatalChartRequest) -> NatalChartResponse:
    try:
        return chart_service.build_natal_chart(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post('/transits', response_model=TransitResponse)
def transits(payload: TransitRequest) -> TransitResponse:
    try:
        return chart_service.calculate_transits(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
