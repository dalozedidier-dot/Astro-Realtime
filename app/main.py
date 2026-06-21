from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes.astro import router as astro_router
from app.api.routes.health import router as health_router
from app.api.routes.realtime import router as legacy_realtime_router
from app.config import settings

STATIC_DIR = Path(__file__).resolve().parent / 'static'
INDEX_FILE = STATIC_DIR / 'index.html'


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
        description='Astro Realtime sert une API FastAPI et une page web complète pour positions, thème natal et transits.',
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    app.include_router(health_router)
    app.include_router(astro_router)
    app.include_router(legacy_realtime_router)

    if STATIC_DIR.exists():
        app.mount('/static', StaticFiles(directory=str(STATIC_DIR)), name='static')

    @app.get('/', include_in_schema=False)
    def index() -> FileResponse:
        return FileResponse(INDEX_FILE)

    return app


app = create_app()
