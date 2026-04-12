from pathlib import Path

from skyfield.api import Loader

from app.core_config import get_settings


class EphemerisLoader:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.data_dir = Path(self.settings.ephemeris_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.loader = Loader(str(self.data_dir))

    def load_timescale(self):
        return self.loader.timescale()

    def load_ephemeris(self):
        local_file = self.data_dir / self.settings.ephemeris_file
        if local_file.exists():
            return self.loader(self.settings.ephemeris_file)

        if not self.settings.allow_ephemeris_download:
            raise FileNotFoundError(
                f"Ephemeris file not found at {local_file}. "
                "Run backend/scripts/download_ephemeris.py or enable downloads."
            )

        return self.loader(self.settings.ephemeris_file)
