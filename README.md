# Astro Realtime Engine

Starter repo fully functional for a real-time astronomy and astrology API.

This project provides:

- a FastAPI backend;
- an initial astronomy engine based on Skyfield and JPL ephemerides;
- an initial astrology engine for signs, whole-sign houses, aspects, and basic transits;
- Docker support;
- GitHub Actions CI;
- tests and documentation to start cleanly on GitHub.

## Technical scope of this starter

This is a serious starter, not a finished astrology platform.

What is already included:

- astronomical position calculation for the main bodies;
- zodiac sign derivation from ecliptic longitude;
- whole-sign house attribution;
- major aspect detection;
- natal chart endpoint;
- transit-to-natal aspect endpoint.

What remains intentionally simple in this version:

- the ascendant is still an initial approximation;
- no Placidus, Koch, Regiomontanus or other advanced house systems yet;
- no progressed charts or solar returns yet;
- no interpretation text engine yet;
- no frontend yet.

## Project structure

```text
astro-realtime-engine/
├── .github/workflows/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── astronomy/
│   │   ├── astrology/
│   │   ├── models/
│   │   ├── services/
│   │   ├── tests/
│   │   └── main.py
│   ├── data/ephemeris/
│   ├── scripts/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── docker-compose.yml
└── README.md
```

## Requirements

- Python 3.11
- Docker optional

## Quick start without Docker

From the repository root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python scripts/download_ephemeris.py
python scripts/run_dev.py
```

The API will then be available at:

- `http://127.0.0.1:8000`
- `http://127.0.0.1:8000/docs`

## Quick start with Docker

From the repository root:

```bash
docker compose up --build
```

Then open:

- `http://127.0.0.1:8000/docs`

At first launch, if the ephemeris file is missing and downloads are allowed, Skyfield will fetch `de421.bsp` automatically.

## API endpoints

### Health

`GET /api/v1/health`

Returns:

```json
{
  "status": "ok"
}
```

### Positions

`POST /api/v1/positions`

Example payload:

```json
{
  "datetime": "2026-04-12T14:30:00+00:00",
  "bodies": ["sun", "moon", "mercury", "venus", "mars"]
}
```

### Natal chart

`POST /api/v1/chart/natal`

Example payload:

```json
{
  "datetime": "1985-09-11T08:30:00+02:00",
  "latitude": 50.8503,
  "longitude": 4.3517,
  "bodies": ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"]
}
```

### Transits

`POST /api/v1/transits`

Example payload:

```json
{
  "natal_datetime": "1985-09-11T08:30:00+02:00",
  "transit_datetime": "2026-04-12T14:30:00+00:00",
  "latitude": 50.8503,
  "longitude": 4.3517,
  "bodies": ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"]
}
```

## Functional notes

### Astronomy engine

The astronomy engine uses Skyfield with JPL ephemerides.

Current outputs include:

- ecliptic longitude;
- ecliptic latitude;
- distance in AU;
- right ascension;
- declination.

### Astrology engine

The astrology layer currently includes:

- zodiac signs from longitude;
- whole-sign houses;
- major aspects: conjunction, sextile, square, trine, opposition;
- transit-to-natal aspect detection.

### Important methodological note

This starter cleanly separates:

- astronomy, which computes positions;
- astrology, which interprets those positions through a symbolic framework.

That separation is essential if you want a robust, auditable system.

## Run tests

```bash
cd backend
pytest -q
```

## Deploy to GitHub

From the repository root:

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/your-user/astro-realtime-engine.git
git push -u origin main
```

## Recommended next steps

A strong next roadmap would be:

1. replace the ascendant approximation with a more rigorous implementation;
2. add a real house system module;
3. add geocoding and timezone helpers;
4. add chart wheel rendering;
5. add authentication and saved charts;
6. add a frontend dashboard;
7. add a proper interpretation engine.

## License

Add the license that matches your business and distribution model.
