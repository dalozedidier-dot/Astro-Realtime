from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone

from app.schemas.request import RealtimePositionsRequest
from app.services.realtime_service import RealtimeService


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description='Astro Realtime CLI')
    parser.add_argument('--datetime', default=None, help='Date ISO 8601. Défaut: maintenant UTC.')
    parser.add_argument('--lat', type=float, default=50.8503, help='Latitude décimale.')
    parser.add_argument('--lon', type=float, default=4.3517, help='Longitude décimale.')
    parser.add_argument('--zodiac', choices=['tropical', 'sidereal'], default='tropical')
    parser.add_argument('--house-system', choices=['whole_sign', 'equal'], default='whole_sign')
    parser.add_argument('--bodies', default='sun,moon,mercury,venus,mars,jupiter,saturn,uranus,neptune,pluto')
    return parser


def main() -> None:
    args = build_parser().parse_args()
    dt = datetime.now(timezone.utc) if args.datetime is None else datetime.fromisoformat(args.datetime.replace('Z', '+00:00'))
    payload = RealtimePositionsRequest(
        datetime=dt,
        lat=args.lat,
        lon=args.lon,
        zodiac=args.zodiac,
        house_system=args.house_system,
        bodies=[body.strip() for body in args.bodies.split(',') if body.strip()],
    )
    result = RealtimeService().get_positions(payload)
    print(json.dumps(result.model_dump(mode='json'), indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
