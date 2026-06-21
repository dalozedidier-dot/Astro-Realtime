/* ==========================================================================
   Astro Realtime — frontend
   Le moteur de calcul autonome (orbital, aspects, maisons, interprétation)
   est conservé à l'identique. Seuls le rendu, la roue et l'ambiance changent.
   ========================================================================== */

const bodies = [
  ['sun', 'Soleil'],
  ['moon', 'Lune'],
  ['mercury', 'Mercure'],
  ['venus', 'Vénus'],
  ['mars', 'Mars'],
  ['jupiter', 'Jupiter'],
  ['saturn', 'Saturne'],
  ['uranus', 'Uranus'],
  ['neptune', 'Neptune'],
  ['pluto', 'Pluton'],
];

const glyphs = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂', jupiter: '♃', saturn: '♄',
  uranus: '♅', neptune: '♆', pluto: '♇'
};

const signOrder = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const signLabels = {
  Aries: 'Bélier', Taurus: 'Taureau', Gemini: 'Gémeaux', Cancer: 'Cancer', Leo: 'Lion', Virgo: 'Vierge',
  Libra: 'Balance', Scorpio: 'Scorpion', Sagittarius: 'Sagittaire', Capricorn: 'Capricorne', Aquarius: 'Verseau', Pisces: 'Poissons'
};
const elementBySign = {
  Aries: 'feu', Leo: 'feu', Sagittarius: 'feu',
  Taurus: 'terre', Virgo: 'terre', Capricorn: 'terre',
  Gemini: 'air', Libra: 'air', Aquarius: 'air',
  Cancer: 'eau', Scorpio: 'eau', Pisces: 'eau',
};

const state = {
  mode: 'realtime',
  autoTimer: null,
  lastResult: null,
  apiBase: localStorage.getItem('astroRealtimeApiBase') || '',
  apiAvailable: false,
};

const els = {
  bodyList: document.querySelector('#body-list'),
  form: document.querySelector('#astro-form'),
  tabs: document.querySelectorAll('.mode-tab'),
  run: document.querySelector('#run-button'),
  now: document.querySelector('#now-button'),
  auto: document.querySelector('#auto-button'),
  statusDot: document.querySelector('#status-dot'),
  apiStatus: document.querySelector('#api-status'),
  apiDetails: document.querySelector('#api-details'),
  apiBase: document.querySelector('#api-base'),
  saveApi: document.querySelector('#save-api-button'),
  runtimeMode: document.querySelector('#runtime-mode'),
  datetime: document.querySelector('#datetime'),
  natalDatetime: document.querySelector('#natal-datetime'),
  transitOnly: document.querySelectorAll('.transit-only'),
  city: document.querySelector('#city-select'),
  lat: document.querySelector('#lat'),
  lon: document.querySelector('#lon'),
  name: document.querySelector('#name'),
  zodiac: document.querySelector('#zodiac'),
  houseSystem: document.querySelector('#house-system'),
  lastUpdate: document.querySelector('#last-update'),
  ascSummary: document.querySelector('#asc-summary'),
  dominantSummary: document.querySelector('#dominant-summary'),
  aspectSummary: document.querySelector('#aspect-summary'),
  wheel: document.querySelector('#wheel'),
  tooltip: document.querySelector('#wheel-tooltip'),
  interpretation: document.querySelector('#interpretation'),
  positionsBody: document.querySelector('#positions-body'),
  aspects: document.querySelector('#aspects'),
  methodNotes: document.querySelector('#method-notes'),
  rawJson: document.querySelector('#raw-json'),
};

function init() {
  startStarfield();
  renderBodyCheckboxes();
  setDateTimeToNow();
  setNatalDefault();
  els.apiBase.value = state.apiBase;
  bindEvents();
  loadMetadata();
  runCalculation();
}

function renderBodyCheckboxes() {
  els.bodyList.innerHTML = bodies.map(([value, label]) => `
    <label class="body-pill">
      <input type="checkbox" name="bodies" value="${value}" checked />
      <span class="glyph">${glyphs[value] || ''}</span>
      <span>${label}</span>
    </label>
  `).join('');
}

function bindEvents() {
  els.tabs.forEach((tab) => {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
  });

  els.run.addEventListener('click', () => runCalculation());
  els.now.addEventListener('click', () => {
    setDateTimeToNow();
    if (state.mode === 'realtime') runCalculation();
  });
  els.auto.addEventListener('click', toggleAutoRefresh);
  els.saveApi.addEventListener('click', () => {
    state.apiBase = cleanApiBase(els.apiBase.value);
    els.apiBase.value = state.apiBase;
    localStorage.setItem('astroRealtimeApiBase', state.apiBase);
    loadMetadata().then(() => runCalculation());
  });

  els.city.addEventListener('change', () => {
    const [lat, lon] = els.city.value.split(',');
    els.lat.value = lat;
    els.lon.value = lon;
  });

  els.form.addEventListener('submit', (event) => {
    event.preventDefault();
    runCalculation();
  });
}

async function loadMetadata() {
  state.apiAvailable = false;
  if (!state.apiBase) {
    setStandaloneStatus();
    return;
  }
  try {
    const response = await fetch(`${state.apiBase}/api/v1/metadata`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.apiAvailable = true;
    els.statusDot.dataset.state = 'live';
    els.apiStatus.textContent = 'Éphéméride connectée';
    els.apiDetails.textContent = `${data.engine || 'backend'} · ${data.supported_bodies?.length || 0} corps`;
    els.runtimeMode.textContent = 'API FastAPI';
  } catch (error) {
    setStandaloneStatus(`API injoignable · ${error.message}`);
  }
}

function setStandaloneStatus(detail = 'Calcul céleste dans le navigateur') {
  els.statusDot.dataset.state = 'standalone';
  els.apiStatus.textContent = 'Mode autonome';
  els.apiDetails.textContent = detail;
  els.runtimeMode.textContent = 'GitHub Pages';
}

function setMode(mode) {
  state.mode = mode;
  els.tabs.forEach((tab) => {
    const active = tab.dataset.mode === mode;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  els.transitOnly.forEach((node) => node.classList.toggle('hidden', mode !== 'transit'));
  if (mode !== 'realtime') stopAutoRefresh();
  runCalculation();
}

function setDateTimeToNow() {
  const now = new Date();
  els.datetime.value = toDatetimeLocal(now);
}

function setNatalDefault() {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 30);
  els.natalDatetime.value = toDatetimeLocal(date);
}

function toDatetimeLocal(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function localToIso(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function cleanApiBase(value) {
  return (value || '').trim().replace(/\/$/, '');
}

function selectedBodies() {
  return [...document.querySelectorAll('input[name="bodies"]:checked')].map((input) => input.value);
}

function basePayload() {
  return {
    lat: Number(els.lat.value),
    lon: Number(els.lon.value),
    zodiac: els.zodiac.value,
    house_system: els.houseSystem.value,
    bodies: selectedBodies(),
  };
}

async function runCalculation() {
  setBusy(true);
  try {
    const payload = buildPayload();
    let data = null;
    if (state.apiAvailable) {
      data = await runApiCalculation(payload);
    } else {
      data = runStandaloneCalculation(payload);
    }
    state.lastResult = data;
    renderResult(data);
  } catch (error) {
    renderError(error);
  } finally {
    setBusy(false);
  }
}

function buildPayload() {
  let payload = { ...basePayload(), datetime: localToIso(els.datetime.value), mode: state.mode };
  if (state.mode === 'natal') {
    payload.name = els.name.value || null;
  }
  if (state.mode === 'transit') {
    payload = {
      ...basePayload(),
      mode: state.mode,
      name: els.name.value || null,
      natal_datetime: localToIso(els.natalDatetime.value),
      transit_datetime: localToIso(els.datetime.value),
    };
  }
  return payload;
}

async function runApiCalculation(payload) {
  let endpoint = '/api/v1/realtime/positions';
  let apiPayload = { ...payload };
  delete apiPayload.mode;

  if (state.mode === 'natal') endpoint = '/api/v1/chart/natal';
  if (state.mode === 'transit') endpoint = '/api/v1/transits';

  const response = await fetch(`${state.apiBase}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(apiPayload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || `HTTP ${response.status}`);
  return data;
}

/* ---------------------------------------------------------------------------
   Moteur autonome (inchangé)
   --------------------------------------------------------------------------- */

function runStandaloneCalculation(payload) {
  if (payload.mode === 'transit') {
    const natal = buildStandaloneChart({ ...payload, datetime: payload.natal_datetime });
    const transit = buildStandaloneChart({ ...payload, datetime: payload.transit_datetime });
    const transitToNatal = computeTransitAspects(transit.bodies, natal.bodies);
    return {
      name: payload.name || null,
      natal,
      transit,
      transit_to_natal_aspects: transitToNatal,
      interpretation: buildInterpretation(transit, transitToNatal, true),
      method_notes: standaloneNotes(true),
    };
  }
  const chart = buildStandaloneChart(payload);
  chart.interpretation = buildInterpretation(chart, chart.aspects, false);
  chart.method_notes = standaloneNotes(false);
  return chart;
}

function buildStandaloneChart(payload) {
  const date = new Date(payload.datetime || new Date());
  const selected = payload.bodies?.length ? payload.bodies : bodies.map(([key]) => key);
  const asc = normalize((date.getUTCHours() + date.getUTCMinutes() / 60) * 15 + payload.lon + 90);
  const houses = Array.from({ length: 12 }, (_, index) => ({
    house: index + 1,
    longitude: normalize(payload.house_system === 'whole_sign' ? Math.floor(asc / 30) * 30 + index * 30 : asc + index * 30),
  }));
  const computedBodies = selected.map((name) => computeBody(name, date, houses, payload.zodiac));
  const aspects = computeAspects(computedBodies);
  const summary = buildSummary(computedBodies);
  return {
    meta: {
      datetime_utc: date.toISOString(),
      engine: 'github-pages-standalone',
      precision: 'approximate-demo',
      zodiac: payload.zodiac,
      house_system: payload.house_system,
      location: { lat: payload.lat, lon: payload.lon },
    },
    angles: {
      asc: decorateLongitude(asc, 0),
      mc: decorateLongitude(normalize(asc + 270), 10),
    },
    houses,
    bodies: computedBodies,
    aspects,
    summary,
  };
}

const orbital = {
  sun: { base: 280.147, period: 365.256, speed: 0.9856 },
  moon: { base: 218.316, period: 27.3216, speed: 13.1764 },
  mercury: { base: 252.251, period: 87.969, speed: 4.0923 },
  venus: { base: 181.979, period: 224.701, speed: 1.6021 },
  mars: { base: 355.433, period: 686.98, speed: 0.5240 },
  jupiter: { base: 34.351, period: 4332.59, speed: 0.0831 },
  saturn: { base: 50.077, period: 10759.22, speed: 0.0335 },
  uranus: { base: 314.055, period: 30688.5, speed: 0.0117 },
  neptune: { base: 304.348, period: 60182, speed: 0.0060 },
  pluto: { base: 238.929, period: 90560, speed: 0.0040 },
};

function computeBody(name, date, houses, zodiac) {
  const days = (date.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0)) / 86400000;
  const cfg = orbital[name] || orbital.sun;
  const siderealShift = zodiac === 'sidereal' ? -24.1 : 0;
  const longitude = normalize(cfg.base + days * 360 / cfg.period + siderealShift + wobble(name, days));
  const house = houseForLongitude(longitude, houses);
  return {
    name,
    longitude,
    sign: signForLongitude(longitude),
    sign_degree: longitude % 30,
    house,
    speed: Number(cfg.speed.toFixed(4)),
    retrograde: false,
  };
}

function wobble(name, days) {
  const index = bodies.findIndex(([key]) => key === name) + 1;
  return Math.sin(days / (18 + index * 7)) * (index < 3 ? 1.2 : 2.8);
}

function houseForLongitude(longitude, houses) {
  let best = 1;
  let bestDiff = 360;
  houses.forEach((house) => {
    const diff = normalize(longitude - house.longitude);
    if (diff >= 0 && diff < bestDiff) {
      bestDiff = diff;
      best = house.house;
    }
  });
  return best;
}

function decorateLongitude(longitude, house) {
  return { longitude, sign: signForLongitude(longitude), sign_degree: longitude % 30, house };
}

function computeAspects(items) {
  const targets = [
    ['conjunction', 0, 8, 'fusion'],
    ['sextile', 60, 4, 'harmonique'],
    ['square', 90, 6, 'tension'],
    ['trine', 120, 6, 'harmonique'],
    ['opposition', 180, 8, 'polarité'],
  ];
  const output = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const diff = angularDistance(items[i].longitude, items[j].longitude);
      for (const [type, angle, maxOrb, nature] of targets) {
        const orb = Math.abs(diff - angle);
        if (orb <= maxOrb) {
          output.push({ a: items[i].name, b: items[j].name, type, orb, nature });
          break;
        }
      }
    }
  }
  return output.sort((a, b) => a.orb - b.orb);
}

function computeTransitAspects(transitBodies, natalBodies) {
  const targets = [
    ['conjunction', 0, 6, 'fusion'],
    ['sextile', 60, 4, 'harmonique'],
    ['square', 90, 5, 'tension'],
    ['trine', 120, 5, 'harmonique'],
    ['opposition', 180, 6, 'polarité'],
  ];
  const output = [];
  transitBodies.forEach((transit) => {
    natalBodies.forEach((natal) => {
      const diff = angularDistance(transit.longitude, natal.longitude);
      for (const [type, angle, maxOrb, nature] of targets) {
        const orb = Math.abs(diff - angle);
        if (orb <= maxOrb) {
          output.push({ transit_body: transit.name, natal_body: natal.name, type, orb, nature });
          break;
        }
      }
    });
  });
  return output.sort((a, b) => a.orb - b.orb).slice(0, 30);
}

function buildSummary(items) {
  const elements = {};
  const signs = {};
  const houses = {};
  items.forEach((item) => {
    elements[elementBySign[item.sign]] = (elements[elementBySign[item.sign]] || 0) + 1;
    signs[item.sign] = (signs[item.sign] || 0) + 1;
    houses[item.house] = (houses[item.house] || 0) + 1;
  });
  return {
    dominant_element: maxKey(elements),
    dominant_sign: maxKey(signs),
    dominant_house: maxKey(houses),
  };
}

function buildInterpretation(chart, aspects, transitMode) {
  const items = [];
  const sun = chart.bodies?.find((body) => body.name === 'sun');
  const moon = chart.bodies?.find((body) => body.name === 'moon');
  if (sun) items.push({ title: `Soleil en ${signLabels[sun.sign]}`, kind: 'placement', weight: 0.9, text: placementText('sun', sun.sign, sun.house) });
  if (moon) items.push({ title: `Lune en ${signLabels[moon.sign]}`, kind: 'placement', weight: 0.85, text: placementText('moon', moon.sign, moon.house) });
  aspects.slice(0, 6).forEach((aspect) => {
    const left = aspect.transit_body ? `Transit ${labelBody(aspect.transit_body)}` : labelBody(aspect.a);
    const right = aspect.natal_body ? `${labelBody(aspect.natal_body)} natal` : labelBody(aspect.b);
    items.push({
      title: `${left} ${labelAspect(aspect.type)} ${right}`,
      kind: transitMode ? 'transit' : 'aspect',
      weight: Number(Math.max(0.2, 1 - aspect.orb / 8).toFixed(2)),
      text: aspectText(aspect.type, transitMode),
    });
  });
  if (!items.length) {
    items.push({ title: 'Lecture générale', kind: 'synthèse', weight: 0.5, text: 'La carte demande surtout une lecture globale des répartitions par signes, maisons et aspects.' });
  }
  return items;
}

function placementText(body, sign, house) {
  const base = body === 'sun'
    ? 'Axe d’expression, de vitalité et de direction consciente.'
    : 'Axe émotionnel, instinctif et réactif.';
  return `${base} La coloration ${signLabels[sign]} donne une tonalité ${elementTone(sign)}. La maison ${house} indique le champ d’expérience le plus activé.`;
}

function elementTone(sign) {
  if (['Aries', 'Leo', 'Sagittarius'].includes(sign)) return 'directe, créative et mobilisatrice';
  if (['Taurus', 'Virgo', 'Capricorn'].includes(sign)) return 'concrète, structurante et pragmatique';
  if (['Gemini', 'Libra', 'Aquarius'].includes(sign)) return 'mentale, relationnelle et circulatoire';
  return 'sensible, intuitive et émotionnelle';
}

function aspectText(type, transitMode) {
  const prefix = transitMode ? 'Transit actif.' : 'Aspect natal.';
  return {
    conjunction: `${prefix} Concentration forte entre deux fonctions. Le symbole fusionne et devient difficile à ignorer.`,
    sextile: `${prefix} Circulation souple. L’aspect ouvre une possibilité si elle est consciemment utilisée.`,
    square: `${prefix} Friction productive ou blocage. Il demande ajustement, effort et clarification.`,
    trine: `${prefix} Fluidité naturelle. L’énergie circule facilement, parfois trop facilement si elle reste passive.`,
    opposition: `${prefix} Polarité à intégrer. Deux pôles se répondent et cherchent un équilibre viable.`,
  }[type] || `${prefix} Relation symbolique significative.`;
}

function standaloneNotes(transitMode) {
  const notes = [
    'GitHub Pages ne peut pas exécuter FastAPI. Cette page utilise donc un moteur client-side approximatif quand aucune API n’est configurée.',
    'Les positions autonomes sont destinées à la démonstration visuelle et éditoriale. Pour des calculs plus précis, déployez le backend FastAPI et indiquez son URL.',
    'Les maisons sont simplifiées en whole sign ou equal. Les aspects utilisent des orbes fixes.',
  ];
  if (transitMode) notes.push('Les transits comparent les positions client-side du moment avec les positions client-side natales.');
  return notes;
}

/* ---------------------------------------------------------------------------
   Rendu
   --------------------------------------------------------------------------- */

function renderResult(data) {
  const chart = data.transit ? data.transit : data;
  els.lastUpdate.textContent = new Date(chart.meta.datetime_utc).toLocaleString('fr-BE', {
    dateStyle: 'medium', timeStyle: 'short',
  });
  els.ascSummary.textContent = chart.angles?.asc
    ? `${glyphs[chart.angles.asc.sign] || ''} ${signLabels[chart.angles.asc.sign] || chart.angles.asc.sign} ${formatDeg(chart.angles.asc.sign_degree)}`
    : 'Non calculé';
  els.dominantSummary.textContent = buildDominantText(chart.summary || {});
  els.aspectSummary.textContent = `${chart.aspects?.length || data.transit_to_natal_aspects?.length || 0}`;

  renderWheel(chart, data.transit_to_natal_aspects || null);
  renderPositions(chart.bodies || []);
  renderAspects(data.transit_to_natal_aspects || chart.aspects || []);
  renderInterpretation(data.interpretation || chart.interpretation || []);
  renderMethod(data.method_notes || chart.method_notes || []);
  els.rawJson.textContent = JSON.stringify(data, null, 2);
}

function renderError(error) {
  els.interpretation.className = 'interpretation is-empty';
  els.interpretation.textContent = `Le calcul n’a pas abouti : ${error.message}. Vérifiez la date, le lieu et l’URL API éventuelle.`;
}

function buildDominantText(summary) {
  const parts = [];
  if (summary.dominant_element) parts.push(`${summary.dominant_element}`);
  if (summary.dominant_sign) parts.push(signLabels[summary.dominant_sign] || summary.dominant_sign);
  if (summary.dominant_house) parts.push(`maison ${summary.dominant_house}`);
  return parts.join(' · ') || 'Aucune';
}

function renderPositions(items) {
  els.positionsBody.innerHTML = items.map((body) => `
    <tr>
      <td><span class="cell-body"><span class="glyph glyph--gold">${glyphs[body.name] || ''}</span>${labelBody(body.name)}</span></td>
      <td><span class="cell-sign"><span class="glyph">${glyphs[body.sign] || ''}</span>${signLabels[body.sign] || body.sign}</span></td>
      <td class="num">${formatDeg(body.sign_degree)}</td>
      <td class="num">${body.house}</td>
      <td class="num">${formatDeg(body.longitude)}</td>
      <td class="num">${body.speed}${body.retrograde ? ' ℞' : ''}</td>
    </tr>
  `).join('');
}

function renderAspects(items) {
  if (!items.length) {
    els.aspects.className = 'aspect-list is-empty';
    els.aspects.textContent = 'Aucun aspect majeur dans les orbes retenus.';
    return;
  }
  els.aspects.className = 'aspect-list';
  els.aspects.innerHTML = items.slice(0, 18).map((aspect) => {
    const left = aspect.transit_body ? `Transit ${labelBody(aspect.transit_body)}` : labelBody(aspect.a);
    const right = aspect.natal_body ? `${labelBody(aspect.natal_body)} natal` : labelBody(aspect.b);
    return `
      <article class="aspect-card" data-nature="${aspectNatureClass(aspect.type)}">
        <span class="aspect-glyph">${aspectGlyph(aspect.type)}</span>
        <div>
          <strong>${left} · ${right}</strong>
          <small>${labelAspect(aspect.type)} · orbe ${Number(aspect.orb).toFixed(2)}°</small>
        </div>
      </article>
    `;
  }).join('');
}

function renderInterpretation(items) {
  if (!items.length) {
    els.interpretation.className = 'interpretation is-empty';
    els.interpretation.textContent = 'Aucune lecture disponible.';
    return;
  }
  els.interpretation.className = 'interpretation';
  els.interpretation.innerHTML = items.slice(0, 10).map((item) => `
    <article class="interpretation-card">
      <header>
        <strong>${item.title}</strong>
        <span class="tag tag--${item.kind}">${item.kind}</span>
      </header>
      <div class="weight-bar" style="--w:${Math.round((item.weight || 0) * 100)}%"></div>
      <p>${item.text}</p>
    </article>
  `).join('');
}

function renderMethod(notes) {
  els.methodNotes.innerHTML = notes.map((note) => `<li>${note}</li>`).join('');
}

/* ---------------------------------------------------------------------------
   La roue — pièce maîtresse
   --------------------------------------------------------------------------- */

function renderWheel(chart, transitAspects) {
  const size = 600;
  const cx = size / 2;
  const cy = size / 2;
  const rZodiacOut = 280;
  const rZodiacIn = 232;
  const rHouseRing = 232;
  const rBodies = 198;
  const rAspectHub = 150;

  // Secteurs alternés des 12 signes
  const sectors = signOrder.map((sign, index) => {
    const a0 = degToRad(index * 30 - 90);
    const a1 = degToRad((index + 1) * 30 - 90);
    const p0 = polar(cx, cy, rZodiacOut, a0);
    const p1 = polar(cx, cy, rZodiacOut, a1);
    const p2 = polar(cx, cy, rZodiacIn, a1);
    const p3 = polar(cx, cy, rZodiacIn, a0);
    const fill = index % 2 === 0 ? 'sector-a' : 'sector-b';
    const element = elementBySign[sign];
    return `<path class="sector ${fill}" data-el="${element}" d="M${p0.x} ${p0.y} A${rZodiacOut} ${rZodiacOut} 0 0 1 ${p1.x} ${p1.y} L${p2.x} ${p2.y} A${rZodiacIn} ${rZodiacIn} 0 0 0 ${p3.x} ${p3.y} Z" />`;
  }).join('');

  // Glyphes des signes gravés au rim
  const signGlyphs = signOrder.map((sign, index) => {
    const angle = degToRad(index * 30 + 15 - 90);
    const p = polar(cx, cy, (rZodiacOut + rZodiacIn) / 2, angle);
    return `<text x="${p.x}" y="${p.y}" class="wheel-sign" data-el="${elementBySign[sign]}" text-anchor="middle" dominant-baseline="central">${glyphs[sign]}</text>`;
  }).join('');

  // Graduations de degrés (toutes les 5°, plus longues tous les 30°)
  const ticks = [];
  for (let d = 0; d < 360; d += 5) {
    const angle = degToRad(d - 90);
    const major = d % 30 === 0;
    const len = major ? 12 : 6;
    const p1 = polar(cx, cy, rZodiacIn, angle);
    const p2 = polar(cx, cy, rZodiacIn - len, angle);
    ticks.push(`<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" class="tick ${major ? 'tick--major' : ''}" />`);
  }

  // Cuspides de maisons
  const houseLines = (chart.houses || []).map((house) => {
    const angle = degToRad(house.longitude - 90);
    const p1 = polar(cx, cy, rAspectHub, angle);
    const p2 = polar(cx, cy, rHouseRing, angle);
    const pl = polar(cx, cy, rAspectHub + 16, angle);
    return `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" class="house-line" />
            <text x="${pl.x}" y="${pl.y}" class="house-num" text-anchor="middle" dominant-baseline="central">${house.house}</text>`;
  }).join('');

  // Toile d'aspects
  const aspectLines = (chart.aspects || []).slice(0, 26).map((aspect, i) => {
    const a = (chart.bodies || []).find((body) => body.name === aspect.a);
    const b = (chart.bodies || []).find((body) => body.name === aspect.b);
    if (!a || !b) return '';
    const pa = pointForLongitude(a.longitude, cx, cy, rAspectHub);
    const pb = pointForLongitude(b.longitude, cx, cy, rAspectHub);
    return `<line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" class="aspect-line aspect-line--${aspect.type}" style="--d:${i * 28}ms" />`;
  }).join('');

  // Nœuds planétaires avec décalage anti-collision
  const placed = [];
  const bodyMarks = (chart.bodies || []).map((body, index) => {
    let radius = rBodies;
    // léger retrait si un corps est trop proche en longitude d'un précédent
    while (placed.some((pl) => Math.abs(radius - pl.r) < 1 && angularDistance(body.longitude, pl.lon) < 9)) {
      radius -= 26;
    }
    placed.push({ r: radius, lon: body.longitude });
    const p = pointForLongitude(body.longitude, cx, cy, radius);
    const spoke1 = pointForLongitude(body.longitude, cx, cy, rZodiacIn - 14);
    const label = glyphs[body.name] || body.name.slice(0, 2).toUpperCase();
    const tip = `${labelBody(body.name)} · ${signLabels[body.sign]} ${formatDeg(body.sign_degree)} · maison ${body.house}`;
    return `
      <g class="body-node" style="--d:${260 + index * 45}ms" data-tip="${tip}">
        <line x1="${p.x}" y1="${p.y}" x2="${spoke1.x}" y2="${spoke1.y}" class="body-spoke" />
        <circle cx="${p.x}" cy="${p.y}" r="16" class="body-halo" />
        <circle cx="${p.x}" cy="${p.y}" r="12.5" class="body-dot" />
        <text x="${p.x}" y="${p.y + 0.5}" text-anchor="middle" dominant-baseline="central" class="body-glyph">${label}</text>
      </g>
    `;
  }).join('');

  const dominant = chart.summary?.dominant_element || '—';
  const centerTime = chart.meta?.datetime_utc
    ? new Date(chart.meta.datetime_utc).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })
    : '';
  const transitNote = transitAspects
    ? `<text x="${cx}" y="${cy + 40}" class="center-note" text-anchor="middle">${transitAspects.length} aspects transit/natal</text>`
    : '';

  els.wheel.innerHTML = `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Roue astrologique">
      <defs>
        <radialGradient id="hub" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(232,184,100,0.16)" />
          <stop offset="70%" stop-color="rgba(232,184,100,0.04)" />
          <stop offset="100%" stop-color="rgba(232,184,100,0)" />
        </radialGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="2.2" /></filter>
      </defs>

      <circle cx="${cx}" cy="${cy}" r="${rAspectHub + 30}" fill="url(#hub)" />
      ${sectors}
      <circle cx="${cx}" cy="${cy}" r="${rZodiacOut}" class="ring ring--brass" />
      <circle cx="${cx}" cy="${cy}" r="${rZodiacIn}" class="ring ring--brass" />
      <circle cx="${cx}" cy="${cy}" r="${rAspectHub}" class="ring ring--inner" />
      ${ticks.join('')}
      ${signGlyphs}
      ${houseLines}
      <g class="aspect-web">${aspectLines}</g>
      ${bodyMarks}

      <circle cx="${cx}" cy="${cy}" r="58" class="center-disc" />
      <text x="${cx}" y="${cy - 12}" class="center-time" text-anchor="middle">${centerTime}</text>
      <text x="${cx}" y="${cy + 12}" class="center-dominant" text-anchor="middle">${dominant}</text>
      ${transitNote}
    </svg>
  `;

  bindWheelTooltips();
}

function bindWheelTooltips() {
  const nodes = els.wheel.querySelectorAll('.body-node');
  const tip = els.tooltip;
  const wrap = els.wheel;
  nodes.forEach((node) => {
    node.addEventListener('mouseenter', () => {
      tip.textContent = node.dataset.tip || '';
      tip.dataset.show = 'true';
    });
    node.addEventListener('mousemove', (e) => {
      const rect = wrap.getBoundingClientRect();
      tip.style.left = `${e.clientX - rect.left}px`;
      tip.style.top = `${e.clientY - rect.top}px`;
    });
    node.addEventListener('mouseleave', () => {
      tip.dataset.show = 'false';
    });
  });
}

/* ---------------------------------------------------------------------------
   Champ d'étoiles ambiant (discret, prefers-reduced-motion respecté)
   --------------------------------------------------------------------------- */

function startStarfield() {
  const canvas = document.querySelector('#starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stars = [];
  let w = 0;
  let h = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(220, Math.floor((w * h) / 7000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3 + 0.2,
      base: Math.random() * 0.5 + 0.15,
      phase: Math.random() * Math.PI * 2,
      twinkle: Math.random() * 0.5 + 0.2,
      gold: Math.random() < 0.12,
    }));
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const a = reduce ? s.base : s.base + Math.sin(t / 1000 + s.phase) * s.twinkle * 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.gold
        ? `rgba(232,184,100,${Math.max(0, a)})`
        : `rgba(226,230,245,${Math.max(0, a)})`;
      ctx.fill();
    }
    if (!reduce) requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  if (reduce) draw(0);
  else requestAnimationFrame(draw);
}

/* ---------------------------------------------------------------------------
   Utilitaires
   --------------------------------------------------------------------------- */

function pointForLongitude(longitude, cx, cy, radius) {
  const angle = degToRad(longitude - 90);
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}
function polar(cx, cy, radius, angle) {
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}
function degToRad(value) { return value * Math.PI / 180; }
function normalize(value) { return ((value % 360) + 360) % 360; }
function signForLongitude(longitude) { return signOrder[Math.floor(normalize(longitude) / 30)]; }
function angularDistance(a, b) { const diff = Math.abs(normalize(a - b)); return diff > 180 ? 360 - diff : diff; }
function maxKey(obj) { return Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0] || null; }

function toggleAutoRefresh() {
  if (state.autoTimer) {
    stopAutoRefresh();
    return;
  }
  if (state.mode !== 'realtime') setMode('realtime');
  els.auto.dataset.active = 'true';
  els.auto.textContent = 'Suivi actif';
  runCalculation();
  state.autoTimer = window.setInterval(() => {
    setDateTimeToNow();
    runCalculation();
  }, 60000);
}

function stopAutoRefresh() {
  if (state.autoTimer) window.clearInterval(state.autoTimer);
  state.autoTimer = null;
  els.auto.dataset.active = 'false';
  els.auto.textContent = 'Suivre le ciel';
}

function setBusy(active) {
  els.run.disabled = active;
  els.run.dataset.busy = active ? 'true' : 'false';
  els.run.textContent = active ? 'Calcul…' : 'Calculer le ciel';
}

function labelBody(value) {
  const found = bodies.find(([key]) => key === value);
  return found ? found[1] : value;
}

function labelAspect(value) {
  return {
    conjunction: 'Conjonction', sextile: 'Sextile', square: 'Carré', trine: 'Trigone', opposition: 'Opposition',
  }[value] || value;
}

function aspectGlyph(type) {
  return { conjunction: '☌', sextile: '⚹', square: '□', trine: '△', opposition: '☍' }[type] || '◦';
}

function aspectNatureClass(type) {
  if (type === 'trine' || type === 'sextile') return 'harmonic';
  if (type === 'square' || type === 'opposition') return 'tension';
  return 'neutral';
}

function formatDeg(value) { return `${Number(value).toFixed(2)}°`; }

init();
