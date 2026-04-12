# Astro-Realtime Backend Suite

Backend FastAPI pour calculs astronomiques et astrologiques en temps réel.

## Contenu

- API FastAPI avec endpoint `/health` et `/realtime/positions`
- moteur de calcul abstrait avec plusieurs providers
- provider `builtin` autonome et déterministe
- provider `skyfield` optionnel pour brancher des éphémérides plus précises
- calcul des signes, degrés, maisons simplifiées, angles, aspects majeurs
- cache mémoire léger
- tests Pytest
- Dockerfile et `docker-compose.yml`

## Démarrage local

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Variables d'environnement

```bash
export APP_NAME="Astro Realtime API"
export APP_ENV="dev"
export ASTRO_ENGINE="builtin"
export DEFAULT_ZODIAC="tropical"
export DEFAULT_HOUSE_SYSTEM="whole_sign"
export CACHE_TTL_SECONDS="15"
```

## Exemple de requête

```bash
curl -X POST http://localhost:8000/realtime/positions \
  -H "Content-Type: application/json" \
  -d '{
    "datetime": "2026-04-12T18:20:00Z",
    "lat": 50.8503,
    "lon": 4.3517,
    "elevation_m": 25,
    "zodiac": "tropical",
    "house_system": "whole_sign",
    "bodies": ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]
  }'
```

## Précision

Le provider `builtin` est autonome et pratique pour le développement, les tests et le câblage API.
Il n'est pas destiné à être la référence astronomique ultime.
Pour une précision supérieure, branchez `provider_skyfield.py` ou remplacez ce provider par Swiss Ephemeris dans la même interface.

## Architecture

```text
app/
  main.py
  config.py
  api/routes/
  astro/
  core/
  schemas/
  services/
  tests/
```
