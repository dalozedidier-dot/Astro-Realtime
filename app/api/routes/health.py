from datetime import datetime, timezone

from fastapi import APIRouter

from app.config import settings

router = APIRouter(tags=['health'])


@router.get('/health')
def health() -> dict:
    return {
        'status': 'ok',
        'engine': settings.astro_engine,
        'version': settings.app_version,
        'time_utc': datetime.now(timezone.utc).isoformat(),
        'env': settings.app_env,
    }
