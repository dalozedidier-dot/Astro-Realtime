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

const state = {
  mode: 'realtime',
  autoTimer: null,
  lastResult: null,
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
  bindEvents();
  loadMetadata();
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
  try {
    const response = await fetch('/api/v1/metadata');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    els.statusDot.classList.add('is-ok');
    els.apiStatus.textContent = 'API active';
    els.apiDetails.textContent = `${data.engine} | ${data.supported_bodies.length} corps supportés`;
  } catch (error) {
    els.statusDot.classList.remove('is-ok');
    els.apiStatus.textContent = 'API indisponible';
    els.apiDetails.textContent = error.message;
  }
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
    let endpoint = '/api/v1/realtime/positions';
    let payload = { ...basePayload(), datetime: localToIso(els.datetime.value) };

    if (state.mode === 'natal') {
      endpoint = '/api/v1/chart/natal';
      payload.name = els.name.value || null;
    }

    if (state.mode === 'transit') {
      endpoint = '/api/v1/transits';
      payload = {
        ...basePayload(),
        name: els.name.value || null,
        natal_datetime: localToIso(els.natalDatetime.value),
        transit_datetime: localToIso(els.datetime.value),
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || `HTTP ${response.status}`);

    state.lastResult = data;
    renderResult(data);
  } catch (error) {
    renderError(error);
  } finally {
    setBusy(false);
  }
}

function setBusy(active) {
  els.run.disabled = active;
  els.run.textContent = active ? 'Calcul...' : 'Calculer';
}

function renderResult(data) {
  const chart = data.transit ? data.transit : data;
  els.lastUpdate.textContent = new Date(chart.meta.datetime_utc).toLocaleString('fr-BE');
  els.ascSummary.textContent = chart.angles?.asc ? `${chart.angles.asc.sign} ${formatDeg(chart.angles.asc.sign_degree)}` : 'Non calculé';
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
  if (summary.dominant_sign) parts.push(summary.dominant_sign);
  if (summary.dominant_house) parts.push(`maison ${summary.dominant_house}`);
  return parts.join(' | ') || 'Aucune';
}

function renderPositions(items) {
  els.positionsBody.innerHTML = items.map((body) => `
    <tr>
      <td><strong>${glyphs[body.name] || ''} ${labelBody(body.name)}</strong></td>
      <td>${glyphs[body.sign] || ''} ${body.sign}</td>
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

function degToRad(value) {
  return value * Math.PI / 180;
}

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

function labelBody(value) {
  const found = bodies.find(([key]) => key === value);
  return found ? found[1] : value;
}

function labelAspect(value) {
  return {
    conjunction: 'Conjonction',
    sextile: 'Sextile',
    square: 'Carré',
    trine: 'Trigone',
    opposition: 'Opposition',
  }[value] || value;
}

function formatDeg(value) {
  return `${Number(value).toFixed(2)}°`;
}

init();
