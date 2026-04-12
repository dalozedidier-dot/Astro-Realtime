from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.realtime import router as realtime_router
from app.config import settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url='/docs' if settings.allow_docs else None,
        redoc_url='/redoc' if settings.allow_docs else None,
        openapi_url='/openapi.json' if settings.allow_docs else None,
        lifespan=lifespan,
    )
    app.include_router(health_router)
    app.include_router(realtime_router)
    return app


app = create_app()
