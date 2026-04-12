from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime

from app.astro.models import BodyPosition


class AstroProvider(ABC):
    @abstractmethod
    def compute_positions(self, dt: datetime, bodies: list[str], lat: float, lon: float) -> list[BodyPosition]:
        raise NotImplementedError
