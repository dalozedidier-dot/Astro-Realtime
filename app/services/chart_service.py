from __future__ import annotations

from app.core.aspects import ASPECT_NATURE, detect_aspect, smallest_angular_distance
from app.core.interpretation import BODY_LABELS_FR, build_method_notes
from app.schemas.request import NatalChartRequest, RealtimePositionsRequest, TransitRequest
from app.schemas.response import InterpretationItem, NatalChartResponse, TransitAspectOut, TransitResponse
from app.services.realtime_service import RealtimeService


class ChartService:
    def __init__(self) -> None:
        self.realtime = RealtimeService()

    def build_natal_chart(self, payload: NatalChartRequest) -> NatalChartResponse:
        realtime_payload = RealtimePositionsRequest(**payload.model_dump(exclude={'name'}))
        chart = self.realtime.get_positions(realtime_payload, calculation_mode='natal')
        return NatalChartResponse(**chart.model_dump(), name=payload.name)

    def calculate_transits(self, payload: TransitRequest) -> TransitResponse:
        natal_payload = RealtimePositionsRequest(
            datetime=payload.natal_datetime,
            lat=payload.lat,
            lon=payload.lon,
            elevation_m=payload.elevation_m,
            zodiac=payload.zodiac,
            house_system=payload.house_system,
            bodies=payload.bodies,
        )
        transit_payload = RealtimePositionsRequest(
            datetime=payload.transit_datetime,
            lat=payload.lat,
            lon=payload.lon,
            elevation_m=payload.elevation_m,
            zodiac=payload.zodiac,
            house_system=payload.house_system,
            bodies=payload.bodies,
        )
        natal = NatalChartResponse(**self.realtime.get_positions(natal_payload, calculation_mode='natal').model_dump(), name=payload.name)
        transit = self.realtime.get_positions(transit_payload, calculation_mode='transit')
        cross_aspects = self._compute_transit_aspects(natal, transit)
        interpretation = self._interpret_transits(cross_aspects)
        method_notes = build_method_notes(transit.meta.engine, transit.meta.house_system, transit.meta.zodiac)
        return TransitResponse(
            name=payload.name,
            natal=natal,
            transit=transit,
            transit_to_natal_aspects=cross_aspects,
            interpretation=interpretation,
            method_notes=method_notes,
        )

    @staticmethod
    def _compute_transit_aspects(natal: NatalChartResponse, transit) -> list[TransitAspectOut]:
        aspects: list[TransitAspectOut] = []
        for transit_body in transit.bodies:
            for natal_body in natal.bodies:
                found = detect_aspect(transit_body.longitude, natal_body.longitude)
                if found is None:
                    continue
                aspect_name, orb = found
                distance = smallest_angular_distance(transit_body.longitude, natal_body.longitude)
                aspects.append(
                    TransitAspectOut(
                        transit_body=transit_body.name,
                        natal_body=natal_body.name,
                        type=aspect_name,
                        orb=round(orb, 6),
                        distance=round(distance, 6),
                        nature=ASPECT_NATURE.get(aspect_name),
                    )
                )
        return sorted(aspects, key=lambda item: item.orb)

    @staticmethod
    def _interpret_transits(aspects: list[TransitAspectOut]) -> list[InterpretationItem]:
        items: list[InterpretationItem] = []
        for aspect in aspects[:10]:
            title = (
                f"Transit {BODY_LABELS_FR.get(aspect.transit_body, aspect.transit_body.title())} "
                f"{aspect.type} {BODY_LABELS_FR.get(aspect.natal_body, aspect.natal_body.title())} natal"
            )
            text = (
                "Ce contact met en relation une dynamique actuelle avec une fonction natale. "
                f"L’orbe de {aspect.orb:.2f}° indique un aspect {'très serré' if aspect.orb <= 1 else 'actif'} dans ce modèle."
            )
            items.append(
                InterpretationItem(
                    kind='transit',
                    title=title,
                    text=text,
                    weight=round(max(0.1, 1.0 - min(aspect.orb, 8.0) / 8.0), 2),
                    nature=aspect.nature,
                )
            )
        return items
