from fastapi import FastAPI

from app.api.router import api_router
from app.core_config import get_settings


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Real-time astronomy and astrology starter API.",
    )

    app.include_router(api_router, prefix=settings.api_prefix)

    @app.get("/", tags=["root"])
    def root() -> dict[str, str]:
        return {
            "message": f"{settings.app_name} is running.",
            "docs": "/docs",
            "openapi": "/openapi.json",
        }

    return app


app = create_app()
