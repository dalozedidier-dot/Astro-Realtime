from __future__ import annotations

from collections import Counter
from typing import Iterable

from app.core.aspects import ASPECT_LABELS_FR, ASPECT_NATURE
from app.core.zodiac import element_from_sign, modality_from_sign
from app.schemas.response import AspectOut, BodyOut, InterpretationItem

BODY_LABELS_FR = {
    'sun': 'Soleil',
    'moon': 'Lune',
    'mercury': 'Mercure',
    'venus': 'Vénus',
    'mars': 'Mars',
    'jupiter': 'Jupiter',
    'saturn': 'Saturne',
    'uranus': 'Uranus',
    'neptune': 'Neptune',
    'pluto': 'Pluton',
}

SIGN_TONES = {
    'Aries': 'élan, décision, impulsion créatrice',
    'Taurus': 'stabilité, ancrage, matérialisation',
    'Gemini': 'circulation, langage, curiosité',
    'Cancer': 'protection, mémoire, sensibilité',
    'Leo': 'rayonnement, affirmation, cœur',
    'Virgo': 'tri, précision, amélioration',
    'Libra': 'équilibre, relation, médiation',
    'Scorpio': 'intensité, transformation, lucidité',
    'Sagittarius': 'vision, expansion, sens',
    'Capricorn': 'structure, responsabilité, durée',
    'Aquarius': 'rupture, réseau, indépendance',
    'Pisces': 'porosité, imaginaire, compassion',
}

HOUSE_TONES = {
    1: 'identité, présence et manière d’entrer dans le monde',
    2: 'ressources, sécurité et valeur concrète',
    3: 'communication, apprentissages et environnement proche',
    4: 'racines, intimité et base intérieure',
    5: 'créativité, désir et expression personnelle',
    6: 'rythme quotidien, santé symbolique et ajustements',
    7: 'relation, miroir et partenariat',
    8: 'crises, héritages invisibles et transformation',
    9: 'vision, transmission et horizon de sens',
    10: 'place sociale, vocation et responsabilité publique',
    11: 'collectifs, réseaux et projection future',
    12: 'retrait, inconscient, clôture de cycle',
}

ASPECT_TONES = {
    'conjunction': 'fusionne deux fonctions et rend leur interaction difficile à ignorer',
    'sextile': 'ouvre une coopération souple, souvent exploitable avec un effort léger',
    'square': 'crée une friction utile, mais exige une mise en forme consciente',
    'trine': 'facilite la circulation, parfois au point de devenir automatique',
    'opposition': 'met deux pôles face à face et demande un équilibre relationnel',
}

WEIGHTED_BODIES = {
    'sun': 3,
    'moon': 3,
    'mercury': 2,
    'venus': 2,
    'mars': 2,
    'jupiter': 1,
    'saturn': 1,
    'uranus': 1,
    'neptune': 1,
    'pluto': 1,
}


def build_chart_summary(bodies: Iterable[BodyOut]) -> dict[str, object]:
    element_counter: Counter[str] = Counter()
    modality_counter: Counter[str] = Counter()
    sign_counter: Counter[str] = Counter()
    house_counter: Counter[int] = Counter()

    for body in bodies:
        weight = WEIGHTED_BODIES.get(body.name, 1)
        element_counter[element_from_sign(body.sign)] += weight
        modality_counter[modality_from_sign(body.sign)] += weight
        sign_counter[body.sign] += weight
        house_counter[body.house] += weight

    return {
        'dominant_element': _first_or_none(element_counter),
        'dominant_modality': _first_or_none(modality_counter),
        'dominant_sign': _first_or_none(sign_counter),
        'dominant_house': _first_or_none(house_counter),
        'elements': dict(element_counter),
        'modalities': dict(modality_counter),
        'signs': dict(sign_counter),
        'houses': {str(key): value for key, value in house_counter.items()},
    }


def build_interpretation(bodies: list[BodyOut], aspects: list[AspectOut]) -> list[InterpretationItem]:
    items: list[InterpretationItem] = []
    by_name = {body.name: body for body in bodies}

    for key in ('sun', 'moon', 'mercury', 'venus', 'mars'):
        body = by_name.get(key)
        if not body:
            continue
        title = f"{BODY_LABELS_FR.get(body.name, body.name.title())} en {body.sign}, maison {body.house}"
        text = (
            f"Cette position met l’accent sur {SIGN_TONES.get(body.sign, 'une coloration symbolique spécifique')}. "
            f"La maison {body.house} renvoie à {HOUSE_TONES.get(body.house, 'un secteur à préciser')}."
        )
        items.append(InterpretationItem(kind='placement', title=title, text=text, weight=round(_placement_weight(body), 2)))

    for aspect in sorted(aspects, key=lambda item: item.orb)[:8]:
        label = ASPECT_LABELS_FR.get(aspect.type, aspect.type.title())
        title = f"{label} {BODY_LABELS_FR.get(aspect.a, aspect.a.title())} / {BODY_LABELS_FR.get(aspect.b, aspect.b.title())}"
        text = f"Cet aspect {ASPECT_TONES.get(aspect.type, 'met en relation deux fonctions du thème')}. Orbe : {aspect.orb:.2f}°."
        weight = max(0.1, 1.0 - min(aspect.orb, 8.0) / 8.0)
        items.append(
            InterpretationItem(
                kind='aspect',
                title=title,
                text=text,
                weight=round(weight, 2),
                nature=ASPECT_NATURE.get(aspect.type),
            )
        )

    return sorted(items, key=lambda item: item.weight, reverse=True)


def build_method_notes(engine_name: str, house_system: str, zodiac: str) -> list[str]:
    notes = [
        f"Moteur actif : {engine_name}.",
        f"Zodiaque : {zodiac}. Système de maisons : {house_system}.",
        "Les maisons et l’ascendant restent approximatifs dans le mode actuel. La page distingue calcul technique et lecture symbolique.",
    ]
    if engine_name == 'builtin':
        notes.append(
            "Le provider builtin est autonome et déterministe. Il sert au développement et au démonstrateur. Pour une précision astronomique supérieure, utilisez Skyfield avec éphémérides locales."
        )
    return notes


def _first_or_none(counter: Counter) -> object | None:
    if not counter:
        return None
    return counter.most_common(1)[0][0]


def _placement_weight(body: BodyOut) -> float:
    base = WEIGHTED_BODIES.get(body.name, 1)
    angular_bonus = 0.5 if body.house in {1, 4, 7, 10} else 0.0
    return base + angular_bonus
