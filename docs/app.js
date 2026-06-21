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
  tabs: document.querySelectorAll('.tab'),
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
  interpretation: document.querySelector('#interpretation'),
  positionsBody: document.querySelector('#positions-body'),
  aspects: document.querySelector('#aspects'),
  methodNotes: document.querySelector('#method-notes'),
  rawJson: document.querySelector('#raw-json'),
};

function init() {
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
    <label>
      <input type="checkbox" name="bodies" value="${value}" checked />
      <span>${glyphs[value] || ''} ${label}</span>
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
    els.statusDot.classList.add('is-ok');
    els.apiStatus.textContent = 'API active';
    els.apiDetails.textContent = `${data.engine || 'backend'} | ${data.supported_bodies?.length || 0} corps supportés`;
    els.runtimeMode.textContent = 'API FastAPI';
  } catch (error) {
    setStandaloneStatus(`API indisponible : ${error.message}`);
  }
}

function setStandaloneStatus(detail = 'Calcul autonome côté navigateur') {
  els.statusDot.classList.add('is-ok');
  els.apiStatus.textContent = 'Mode autonome actif';
  els.apiDetails.textContent = detail;
  els.runtimeMode.textContent = 'GitHub Pages autonome';
}

function setMode(mode) {
  state.mode = mode;
  els.tabs.forEach((tab) => tab.classList.toggle('is-active', tab.dataset.mode === mode));
  els.transitOnly.forEach((node) => node.classList.toggle('hidden', mode !== 'transit'));
  if (mode !== 'realtime') stopAutoRefresh();
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
  const elementBySign = {
    Aries: 'feu', Leo: 'feu', Sagittarius: 'feu',
    Taurus: 'terre', Virgo: 'terre', Capricorn: 'terre',
    Gemini: 'air', Libra: 'air', Aquarius: 'air',
    Cancer: 'eau', Scorpio: 'eau', Pisces: 'eau',
  };
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

function renderResult(data) {
  const chart = data.transit ? data.transit : data;
  els.lastUpdate.textContent = new Date(chart.meta.datetime_utc).toLocaleString('fr-BE');
  els.ascSummary.textContent = chart.angles?.asc ? `${signLabels[chart.angles.asc.sign] || chart.angles.asc.sign} ${formatDeg(chart.angles.asc.sign_degree)}` : 'Non calculé';
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
  els.interpretation.className = 'interpretation empty';
  els.interpretation.textContent = `Erreur : ${error.message}`;
}

function buildDominantText(summary) {
  const parts = [];
  if (summary.dominant_element) parts.push(`élément ${summary.dominant_element}`);
  if (summary.dominant_sign) parts.push(signLabels[summary.dominant_sign] || summary.dominant_sign);
  if (summary.dominant_house) parts.push(`maison ${summary.dominant_house}`);
  return parts.join(' | ') || 'Aucune';
}

function renderPositions(items) {
  els.positionsBody.innerHTML = items.map((body) => `
    <tr>
      <td><strong>${glyphs[body.name] || ''} ${labelBody(body.name)}</strong></td>
      <td>${glyphs[body.sign] || ''} ${signLabels[body.sign] || body.sign}</td>
      <td>${formatDeg(body.sign_degree)}</td>
      <td>${body.house}</td>
      <td>${formatDeg(body.longitude)}</td>
      <td>${body.speed}${body.retrograde ? ' R' : ''}</td>
    </tr>
  `).join('');
}

function renderAspects(items) {
  if (!items.length) {
    els.aspects.className = 'aspect-list empty';
    els.aspects.textContent = 'Aucun aspect affiché.';
    return;
  }
  els.aspects.className = 'aspect-list';
  els.aspects.innerHTML = items.slice(0, 18).map((aspect) => {
    const left = aspect.transit_body ? `Transit ${labelBody(aspect.transit_body)}` : labelBody(aspect.a);
    const right = aspect.natal_body ? `${labelBody(aspect.natal_body)} natal` : labelBody(aspect.b);
    return `
      <article class="aspect-card">
        <strong>${left} / ${right}</strong>
        <small>${labelAspect(aspect.type)} | orbe ${Number(aspect.orb).toFixed(2)}° | ${aspect.nature || 'aspect'}</small>
      </article>
    `;
  }).join('');
}

function renderInterpretation(items) {
  if (!items.length) {
    els.interpretation.className = 'interpretation empty';
    els.interpretation.textContent = 'Aucune lecture disponible.';
    return;
  }
  els.interpretation.className = 'interpretation';
  els.interpretation.innerHTML = items.slice(0, 10).map((item) => `
    <article class="interpretation-card">
      <strong>${item.title}</strong>
      <small>${item.kind} | poids ${item.weight}</small>
      <p>${item.text}</p>
    </article>
  `).join('');
}

function renderMethod(notes) {
  els.methodNotes.innerHTML = notes.map((note) => `<li>${note}</li>`).join('');
}

function renderWheel(chart, transitAspects) {
  const size = 560;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 245;
  const rInner = 180;
  const rBodies = 202;

  const lines = [];
  for (let i = 0; i < 12; i += 1) {
    const angle = degToRad(i * 30 - 90);
    const x1 = cx + Math.cos(angle) * rInner;
    const y1 = cy + Math.sin(angle) * rInner;
    const x2 = cx + Math.cos(angle) * rOuter;
    const y2 = cy + Math.sin(angle) * rOuter;
    lines.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="wheel-line" />`);
  }

  const signs = signOrder.map((sign, index) => {
    const angle = degToRad(index * 30 + 15 - 90);
    const x = cx + Math.cos(angle) * 224;
    const y = cy + Math.sin(angle) * 224;
    return `<text x="${x}" y="${y}" class="wheel-sign" text-anchor="middle" dominant-baseline="middle">${glyphs[sign]}</text>`;
  }).join('');

  const houseLines = (chart.houses || []).map((house) => {
    const angle = degToRad(house.longitude - 90);
    const x1 = cx + Math.cos(angle) * 70;
    const y1 = cy + Math.sin(angle) * 70;
    const x2 = cx + Math.cos(angle) * rOuter;
    const y2 = cy + Math.sin(angle) * rOuter;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="house-line" />`;
  }).join('');

  const aspectLines = (chart.aspects || []).slice(0, 22).map((aspect) => {
    const a = (chart.bodies || []).find((body) => body.name === aspect.a);
    const b = (chart.bodies || []).find((body) => body.name === aspect.b);
    if (!a || !b) return '';
    const pa = pointForLongitude(a.longitude, cx, cy, 132);
    const pb = pointForLongitude(b.longitude, cx, cy, 132);
    return `<line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" class="aspect-line ${aspect.type}" />`;
  }).join('');

  const bodyMarks = (chart.bodies || []).map((body, index) => {
    const p = pointForLongitude(body.longitude, cx, cy, rBodies - (index % 3) * 13);
    const label = glyphs[body.name] || body.name.slice(0, 2).toUpperCase();
    return `
      <g>
        <circle cx="${p.x}" cy="${p.y}" r="13" class="body-dot" />
        <text x="${p.x}" y="${p.y + 1}" text-anchor="middle" dominant-baseline="middle" class="body-label">${label}</text>
      </g>
    `;
  }).join('');

  const transitNote = transitAspects ? `<text x="${cx}" y="${cy + 38}" class="wheel-center-note" text-anchor="middle">${transitAspects.length} aspects transit/natal</text>` : '';

  els.wheel.innerHTML = `
    <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .wheel-ring{fill:none;stroke:rgba(255,255,255,.32);stroke-width:1.2}
        .wheel-line,.house-line{stroke:rgba(255,255,255,.16);stroke-width:1}
        .house-line{stroke-dasharray:4 5}
        .wheel-sign{fill:rgba(244,247,251,.78);font-size:26px}
        .aspect-line{stroke:rgba(183,215,255,.36);stroke-width:1.1}
        .aspect-line.square,.aspect-line.opposition{stroke:rgba(255,149,138,.48)}
        .aspect-line.trine,.aspect-line.sextile{stroke:rgba(159,240,200,.42)}
        .body-dot{fill:rgba(11,16,32,.86);stroke:rgba(183,215,255,.9);stroke-width:1.2}
        .body-label{fill:#f4f7fb;font-size:17px;font-weight:700}
        .wheel-center{fill:rgba(255,255,255,.06);stroke:rgba(255,255,255,.12)}
        .wheel-center-text{fill:#f4f7fb;font-size:19px;font-weight:800}
        .wheel-center-note{fill:rgba(174,184,206,.9);font-size:12px}
      </style>
      <circle cx="${cx}" cy="${cy}" r="${rOuter}" class="wheel-ring" />
      <circle cx="${cx}" cy="${cy}" r="${rInner}" class="wheel-ring" />
      <circle cx="${cx}" cy="${cy}" r="128" class="wheel-ring" />
      ${lines.join('')}
      ${houseLines}
      ${signs}
      ${aspectLines}
      ${bodyMarks}
      <circle cx="${cx}" cy="${cy}" r="62" class="wheel-center" />
      <text x="${cx}" y="${cy - 3}" class="wheel-center-text" text-anchor="middle">Astro</text>
      ${transitNote}
    </svg>
  `;
}

function pointForLongitude(longitude, cx, cy, radius) {
  const angle = degToRad(longitude - 90);
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
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
  els.auto.textContent = 'Auto refresh actif';
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
  els.auto.textContent = 'Auto refresh';
}

function setBusy(active) {
  els.run.disabled = active;
  els.run.textContent = active ? 'Calcul...' : 'Calculer';
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

function formatDeg(value) { return `${Number(value).toFixed(2)}°`; }

init();
