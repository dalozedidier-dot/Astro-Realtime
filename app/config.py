from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Astro Realtime API"
    app_env: str = "dev"
    app_version: str = "internal"
    astro_engine: str = "builtin"
    default_zodiac: str = "tropical"
    default_house_system: str = "whole_sign"
    cache_ttl_seconds: int = 15
    allow_docs: bool = True

    model_config = SettingsConfigDict(
        env_file='.env',
        extra='ignore',
        case_sensitive=False,
    )


settings = Settings()
