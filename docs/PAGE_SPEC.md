# Spécification de page Astro Realtime

## Objectif

Transformer un moteur astro API en page complète utilisable par un visiteur non technique.

## Parcours utilisateur

1. Choisir un mode : temps réel, thème natal ou transits.
2. Choisir un lieu via ville rapide ou latitude/longitude.
3. Choisir la date et l’heure.
4. Choisir le zodiaque et le système de maisons.
5. Sélectionner les corps célestes.
6. Lancer le calcul.
7. Lire la roue, les positions, les aspects, la synthèse et les notes de méthode.

## Blocs de page

- Hero clair avec état API.
- Panneau de paramètres.
- Résumé : heure, ascendant, dominante, nombre d’aspects.
- Roue astrologique SVG.
- Lecture synthétique.
- Table des positions.
- Liste des aspects.
- Notes de méthode et JSON brut.

## Contrat API frontend

### `/api/v1/realtime/positions`

Entrée :

```json
{
  "datetime": "2026-06-21T18:00:00+02:00",
  "lat": 50.8503,
  "lon": 4.3517,
  "zodiac": "tropical",
  "house_system": "whole_sign",
  "bodies": ["sun", "moon", "mars"]
}
```

Sortie :

- `meta`
- `location`
- `angles`
- `houses`
- `bodies`
- `aspects`
- `summary`
- `interpretation`
- `method_notes`

### `/api/v1/chart/natal`

Même contrat, avec `name` facultatif et `calculation_mode = natal`.

### `/api/v1/transits`

Entrée :

```json
{
  "natal_datetime": "1980-04-15T12:00:00+02:00",
  "transit_datetime": "2026-06-21T18:00:00+02:00",
  "lat": 50.8503,
  "lon": 4.3517,
  "bodies": ["sun", "moon", "mars"]
}
```

Sortie :

- `natal`
- `transit`
- `transit_to_natal_aspects`
- `interpretation`
- `method_notes`

## Limites affichées

La page doit garder une frontière nette entre calcul astronomique approximatif, visualisation et lecture symbolique. C’est volontaire : cela renforce la crédibilité du démonstrateur.
