from cachetools import TTLCache

from app.config import settings

cache = TTLCache(maxsize=512, ttl=settings.cache_ttl_seconds)
