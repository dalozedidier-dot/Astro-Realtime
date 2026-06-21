# Astro Realtime

Astro Realtime est maintenant une application complète : une API FastAPI, une page web servie directement par le backend, une roue astrologique SVG, des calculs temps réel, un thème natal, des transits, des aspects, une synthèse symbolique et des tests.

## Ce que contient cette mise à jour

- Page web complète dans `app/static/`.
- API moderne sous `/api/v1`.
- Ancien endpoint `/realtime/positions` conservé pour compatibilité.
- Mode temps réel avec date courante et auto refresh côté frontend.
- Mode thème natal.
- Mode transits natal/actuel.
- Roue astrologique SVG sans dépendance lourde.
- Table des positions.
- Liste des aspects majeurs.
- Interprétation sobre des placements et aspects.
- Métadonnées API.
- Notes de méthode et limites affichées dans l’interface.
- CLI `astro-realtime`.
- Tests API, frontend statique, validation, thème natal et transits.
- Docker et GitHub Actions unifiés sur l’application racine.

## Structure

```text
app/
  main.py
  api/routes/
    astro.py
    health.py
    realtime.py
  astro/
    engine.py
    provider_builtin.py
    provider_skyfield.py
  core/
    aspects.py
    houses.py
    interpretation.py
    time.py
    zodiac.py
  schemas/
    request.py
    response.py
  services/
    realtime_service.py
    chart_service.py
  static/
    index.html
    styles.css
    app.js
  tests/

docs/
  PAGE_SPEC.md

pyproject.toml
requirements.txt
Dockerfile
docker-compose.yml
```

## Démarrage local

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Ouvrir ensuite :

```text
http://localhost:8000/
```

Documentation API :

```text
http://localhost:8000/docs
```

## Docker

```bash
docker compose up --build
```

Puis ouvrir :

```text
http://localhost:8000/
```

## Endpoints principaux

```text
GET  /health
GET  /api/v1/metadata
GET  /api/v1/now
POST /api/v1/realtime/positions
POST /api/v1/chart/natal
POST /api/v1/transits
POST /realtime/positions
```

## Exemple API

```bash
curl -X POST http://localhost:8000/api/v1/realtime/positions \
  -H "Content-Type: application/json" \
  -d '{
    "datetime": "2026-06-21T18:00:00+02:00",
    "lat": 50.8503,
    "lon": 4.3517,
    "zodiac": "tropical",
    "house_system": "whole_sign",
    "bodies": ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]
  }'
```

## CLI

```bash
python -m app.cli --lat 50.8503 --lon 4.3517 --datetime 2026-06-21T18:00:00+02:00
```

Ou après installation éditable :

```bash
pip install -e .
astro-realtime --lat 50.8503 --lon 4.3517
```

## Tests

```bash
pytest
```

## Variables d’environnement

```bash
APP_NAME="Astro Realtime"
APP_ENV="dev"
APP_VERSION="local"
ASTRO_ENGINE="builtin"
DEFAULT_ZODIAC="tropical"
DEFAULT_HOUSE_SYSTEM="whole_sign"
CACHE_TTL_SECONDS="15"
ALLOW_DOCS="true"
REALTIME_REFRESH_SECONDS="60"
```

## Précision et limites

Le provider `builtin` est autonome, déterministe et utile pour développer l’interface sans dépendre d’un téléchargement d’éphémérides. Il ne doit pas être présenté comme une référence astronomique définitive.

Pour pousser la précision, utiliser `ASTRO_ENGINE=skyfield` avec des éphémérides disponibles localement. Les maisons et l’ascendant restent approximatifs dans cette étape. L’interface affiche cette limite pour éviter de mélanger précision technique et lecture symbolique.

## Prochaines améliorations recommandées

- Brancher Skyfield par défaut avec éphémérides locales contrôlées.
- Ajouter Swiss Ephemeris si l’objectif est une précision astrologique plus stricte.
- Ajouter Placidus, Koch et maisons égales raffinées.
- Ajouter recherche de ville via API géocodage.
- Ajouter export PNG/PDF de la roue.
- Ajouter synastrie et progressions.
- Ajouter mode multilingue FR/EN.

## GitHub Pages

A static public page is available in `docs/` and can be deployed with GitHub Pages.

Expected URL once Pages is enabled:

```text
https://dalozedidier-dot.github.io/Astro-Realtime/
```

The GitHub Pages version runs in standalone browser mode because GitHub Pages cannot execute FastAPI. If the FastAPI backend is deployed on another host, paste that backend URL into the optional API field on the page.

To deploy from GitHub:

1. Go to **Settings > Pages**.
2. Select **GitHub Actions** as the source.
3. Run **Actions > Deploy GitHub Pages > Run workflow**.
4. Open the URL displayed in the workflow summary.
