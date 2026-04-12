from fastapi import APIRouter

from app.api.routes import chart, health, positions, transits

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(positions.router, prefix="/positions", tags=["positions"])
api_router.include_router(chart.router, prefix="/chart", tags=["chart"])
api_router.include_router(transits.router, prefix="/transits", tags=["transits"])
