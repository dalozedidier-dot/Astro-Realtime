from pathlib import Path

from skyfield.api import Loader

EPHEMERIS_FILE = "de421.bsp"
DATA_DIR = Path("data/ephemeris")


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    loader = Loader(str(DATA_DIR))
    loader(EPHEMERIS_FILE)
    print(f"Downloaded {EPHEMERIS_FILE} into {DATA_DIR.resolve()}")


if __name__ == "__main__":
    main()
