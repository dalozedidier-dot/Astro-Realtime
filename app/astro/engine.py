from app.astro.provider_base import AstroProvider
from app.astro.provider_builtin import BuiltinProvider
from app.core.errors import ProviderError
from app.config import settings


class AstroEngine:
    def __init__(self) -> None:
        self.provider = self._build_provider(settings.astro_engine)

    @staticmethod
    def _build_provider(name: str) -> AstroProvider:
        normalized = (name or "builtin").strip().lower()
        if normalized == "builtin":
            return BuiltinProvider()
        if normalized == "skyfield":
            from app.astro.provider_skyfield import SkyfieldProvider
            return SkyfieldProvider()
        raise ProviderError(f"Provider inconnu: {name}")
