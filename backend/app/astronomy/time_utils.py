from datetime import datetime, timezone


def parse_iso_datetime(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    dt = datetime.fromisoformat(normalized)
    if dt.tzinfo is None:
        raise ValueError("datetime must include timezone information")
    return dt.astimezone(timezone.utc)
