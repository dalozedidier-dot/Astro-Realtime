from app.astrology.chart_builder import ChartBuilder
from app.models.request_models import ChartRequest, TransitRequest
from app.models.response_models import NatalChartResponse, TransitResponse


class ChartService:
    def __init__(self) -> None:
        self.builder = ChartBuilder()

    def build_natal_chart(self, payload: ChartRequest) -> NatalChartResponse:
        data = self.builder.build_natal_chart(
            dt_iso=payload.datetime,
            latitude=payload.latitude,
            longitude=payload.longitude,
            bodies=payload.bodies,
        )
        return NatalChartResponse(**data)

    def calculate_transits(self, payload: TransitRequest) -> TransitResponse:
        data = self.builder.calculate_transits(
            natal_dt_iso=payload.natal_datetime,
            transit_dt_iso=payload.transit_datetime,
            latitude=payload.latitude,
            longitude=payload.longitude,
            bodies=payload.bodies,
        )
        return TransitResponse(**data)
