/* ============================================================
   GRIDIQ — App Logic  |  app.js
   All data is sourced from GRIDIQ_DATABASE (database.js)
   ============================================================ */

/* ─── APP STATE ──────────────────────────────────────────── */
const STATE = {
  activeTab: 'home',
  countdownTimer: null,
  predictor: { weather: 'dry', penalties: {}, penaltiesExpanded: false },
  fantasy: {
    slots: [
      { type:'driver', label:'DRV', id:null },
      { type:'driver', label:'DRV', id:null },
      { type:'driver', label:'DRV', id:null },
      { type:'driver', label:'DRV', id:null },
      { type:'driver', label:'DRV', id:null },
      { type:'constructor', label:'TEAM', id:null },
      { type:'constructor', label:'TEAM', id:null }
    ],
    pickerSlot: null,
    ppmFilter: 'all'   // 'all' | 'driver' | 'constructor'
  },
  modal: { open: false, context: null }
};

/* ─── HELPERS ────────────────────────────────────────────── */
function getDriver(id) { return GRIDIQ_DATABASE.drivers.find(d => d.id === id); }
function getConstructor(id) { return GRIDIQ_DATABASE.constructors.find(c => c.id === id); }
function getRace(id) { return GRIDIQ_DATABASE.races.find(r => r.id === id); }

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short' });
}

function teamColor(constructorId) {
  const c = getConstructor(constructorId);
  return c ? c.color : '#666';
}

/* ─── NAVIGATION ─────────────────────────────────────────── */
function switchTab(tab) {
  if ((tab === 'fantasy' || tab === 'compare') && typeof isGridIQPro === 'function' && !isGridIQPro()) {
    openProModal();
    return;
  }
  if (STATE.activeTab === tab) return;
  STATE.activeTab = tab;
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('section-' + tab).classList.add('active');
  document.querySelector(`.nav-btn[data-tab="${tab}"]`).classList.add('active');
  // Close mobile hamburger menu
  document.getElementById('top-nav').classList.remove('nav-open');
  const hamburger = document.getElementById('nav-hamburger');
  if (hamburger) hamburger.textContent = '☰';
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* ─── HERO STATS STRIP ───────────────────────────────────── */
function renderHeroStats() {
  const container = document.getElementById('hero-stats-bar');
  if (!container) return;

  const nextRace     = getNextRace();
  const drivers      = [...GRIDIQ_DATABASE.drivers].sort((a,b) => b.points - a.points);
  const constructors = [...GRIDIQ_DATABASE.constructors].sort((a,b) => b.points - a.points);
  const completed    = GRIDIQ_DATABASE.races.filter(r => r.status === 'completed').length;
  const total        = GRIDIQ_DATABASE.races.length;

  container.innerHTML = `
    <div class="hero-stat">
      <div class="hero-stat-label">NEXT RACE</div>
      <div class="hero-stat-value">${nextRace.flag} ${nextRace.country.toUpperCase()}</div>
      <div class="hero-stat-sub">${formatDate(nextRace.date)} &nbsp;·&nbsp; R${nextRace.round} / ${total}</div>
    </div>
    <div class="hero-stat">
      <div class="hero-stat-label">SEASON</div>
      <div class="hero-stat-value">${completed}<span style="font-size:11px;font-weight:400;color:var(--text-3)"> / ${total}</span></div>
      <div class="hero-stat-sub">ROUNDS COMPLETE</div>
    </div>
    <div class="hero-stat">
      <div class="hero-stat-label">WDC LEADER</div>
      <div class="hero-stat-value hero-stat-team-color" style="color:${drivers[0].color}">${drivers[0].lastName.toUpperCase()}</div>
      <div class="hero-stat-sub">${drivers[0].points} PTS &nbsp;·&nbsp; ${getConstructor(drivers[0].constructorId).shortName}</div>
    </div>
    <div class="hero-stat">
      <div class="hero-stat-label">WCC LEADER</div>
      <div class="hero-stat-value hero-stat-team-color" style="color:${constructors[0].color}">${constructors[0].shortName || constructors[0].name.toUpperCase()}</div>
      <div class="hero-stat-sub">${constructors[0].points} PTS</div>
    </div>
  `;
}

/* ─── COUNTDOWN ──────────────────────────────────────────── */
function getNextRace() {
  const now = new Date();
  const upcoming = GRIDIQ_DATABASE.races
    .filter(r => new Date(r.date + 'T15:00:00Z') > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  return upcoming[0] || GRIDIQ_DATABASE.races[GRIDIQ_DATABASE.races.length - 1];
}

function renderRaceHero() {
  const race = getNextRace();
  const el   = document.getElementById('race-hero');
  const completed = GRIDIQ_DATABASE.races.filter(r => r.status === 'completed');
  const lastRace  = completed[completed.length - 1];
  const total     = GRIDIQ_DATABASE.races.length;

  el.innerHTML = `
    <div class="hero-eyebrow">
      <span class="live-pill"><span class="dot-pulse"></span>UPCOMING · R${race.round}/${total}</span>
      <span style="color:var(--text-3);font-size:9px">${completed.length} RACES DONE</span>
    </div>
    <div class="hero-name">${race.name}</div>
    <div class="hero-location">${race.flag} ${race.circuit} · ${race.city}</div>
    <div class="hero-specs">
      <div class="hero-spec">
        <span class="spec-val">${race.round}</span>
        <span class="spec-lbl">ROUND</span>
      </div>
      <div class="hero-spec">
        <span class="spec-val">${race.laps}</span>
        <span class="spec-lbl">LAPS</span>
      </div>
      <div class="hero-spec">
        <span class="spec-val">${race.length}</span>
        <span class="spec-lbl">KM/LAP</span>
      </div>
    </div>
    ${lastRace ? `
    <div style="display:flex;align-items:center;gap:8px;padding:9px 10px;background:rgba(255,255,255,0.03);border-radius:6px;margin-bottom:12px;border-left:2px solid var(--accent)">
      <div>
        <div style="font-family:var(--font-tech);font-size:9px;letter-spacing:2px;color:var(--text-3);margin-bottom:2px">LAST RACE · R${lastRace.round}</div>
        <div style="font-family:var(--font-tech);font-size:12px;color:var(--text)">${lastRace.flag} ${lastRace.country} — Won by <strong style="color:var(--accent)">${lastRace.winner}</strong></div>
      </div>
    </div>
    ` : ''}
    <div class="hero-divider"></div>
    <div class="cd-label">RACE DAY COUNTDOWN — ${formatDate(race.date)}</div>
    <div id="countdown-display" class="countdown"></div>
  `;

  updateCountdown(race);
  if (STATE.countdownTimer) clearInterval(STATE.countdownTimer);
  STATE.countdownTimer = setInterval(() => updateCountdown(race), 1000);
}

function updateCountdown(race) {
  const el = document.getElementById('countdown-display');
  if (!el) return;
  const now = new Date();
  const target = new Date(race.date + 'T15:00:00Z');
  const diff = target - now;

  if (diff <= 0) {
    el.innerHTML = `<div class="hero-past">Race weekend concluded — season continues</div>`;
    return;
  }

  const days    = Math.floor(diff / 86400000);
  const hours   = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000)  / 60000);
  const seconds = Math.floor((diff % 60000)    / 1000);

  el.innerHTML = `
    <div class="cd-unit"><span class="cd-num">${String(days).padStart(2,'0')}</span><span class="cd-uname">DAYS</span></div>
    <span class="cd-sep">:</span>
    <div class="cd-unit"><span class="cd-num">${String(hours).padStart(2,'0')}</span><span class="cd-uname">HRS</span></div>
    <span class="cd-sep">:</span>
    <div class="cd-unit"><span class="cd-num">${String(minutes).padStart(2,'0')}</span><span class="cd-uname">MIN</span></div>
    <span class="cd-sep">:</span>
    <div class="cd-unit"><span class="cd-num">${String(seconds).padStart(2,'0')}</span><span class="cd-uname">SEC</span></div>
  `;
}

/* ─── CHAMPIONSHIP HUB ───────────────────────────────────── */
function renderChampionshipHub() {
  const drivers = [...GRIDIQ_DATABASE.drivers].sort((a,b) => b.points - a.points);
  const constructors = [...GRIDIQ_DATABASE.constructors].sort((a,b) => b.points - a.points);

  const wdcLeader = drivers[0];
  const wccLeader = constructors[0];

  document.getElementById('wdc-card').innerHTML = `
    <div class="champ-type">WDC LEADER</div>
    <div class="champ-color-bar" style="background:${wdcLeader.color}"></div>
    <div class="champ-name">${wdcLeader.firstName}<br>${wdcLeader.lastName.toUpperCase()}</div>
    <div class="champ-sub">${getConstructor(wdcLeader.constructorId).shortName}</div>
    <div class="champ-pts">${wdcLeader.points}</div>
    <div class="champ-pts-lbl">POINTS</div>
  `;

  document.getElementById('wcc-card').innerHTML = `
    <div class="champ-type">WCC LEADER</div>
    <div class="champ-color-bar" style="background:${wccLeader.color}"></div>
    <div class="champ-name">${wccLeader.name.toUpperCase()}</div>
    <div class="champ-sub">${wccLeader.engine}</div>
    <div class="champ-pts">${wccLeader.points}</div>
    <div class="champ-pts-lbl">POINTS</div>
  `;
}

/* ─── DRIVER STANDINGS ───────────────────────────────────── */
function renderDriverStandings() {
  const LIMIT = 10;
  const drivers = [...GRIDIQ_DATABASE.drivers].sort((a,b) => b.points - a.points);
  const leaderPts = drivers[0].points;
  const container = document.getElementById('driver-standings');
  let expanded = false;

  function build() {
    container.innerHTML = '';
    const visible = expanded ? drivers : drivers.slice(0, LIMIT);

    visible.forEach((d, i) => {
      const posClass = i===0?'p1':i===1?'p2':i===2?'p3':'';
      const gap = i===0 ? 'LEADER' : `-${leaderPts - d.points}`;
      const row = document.createElement('div');
      row.className = 's-row';
      row.innerHTML = `
        <div class="s-pos ${posClass}">${i+1}</div>
        <div class="s-dot" style="background:${d.color}"></div>
        <div class="s-info">
          <div class="s-name">${d.firstName.toUpperCase()} ${d.lastName.toUpperCase()}</div>
          <div class="s-team">${getConstructor(d.constructorId).shortName}</div>
        </div>
        <div class="s-pts">${d.points}</div>
        <div class="s-gap">${gap}</div>
      `;
      row.addEventListener('click', () => openDriverModal(d.id));
      container.appendChild(row);
    });

    const btn = document.createElement('button');
    btn.className = 'expand-btn' + (expanded ? ' expanded' : '');
    btn.innerHTML = expanded
      ? `SHOW LESS <span class="expand-arrow">▼</span>`
      : `SHOW ALL ${drivers.length} DRIVERS <span class="expand-arrow">▼</span>`;
    btn.addEventListener('click', () => { expanded = !expanded; build(); });
    container.appendChild(btn);
  }

  build();
}

/* ─── CONSTRUCTOR STANDINGS ──────────────────────────────── */
function renderConstructorStandings() {
  const LIMIT = 5;
  const constructors = [...GRIDIQ_DATABASE.constructors].sort((a,b) => b.points - a.points);
  const leaderPts = constructors[0].points;
  const container = document.getElementById('constructor-standings');
  let expanded = false;

  function build() {
    container.innerHTML = '';
    const visible = expanded ? constructors : constructors.slice(0, LIMIT);

    visible.forEach((c, i) => {
      const posClass = i===0?'p1':i===1?'p2':i===2?'p3':'';
      const gap = i===0 ? 'LEADER' : leaderPts - c.points > 0 ? `-${leaderPts - c.points}` : '—';
      const driversStr = c.drivers.map(id => {
        const d = getDriver(id);
        return d ? d.lastName : id;
      }).join(' / ');

      const row = document.createElement('div');
      row.className = 's-row';
      row.innerHTML = `
        <div class="s-pos ${posClass}">${i+1}</div>
        <div class="s-dot" style="background:${c.color}"></div>
        <div class="s-info">
          <div class="s-name">${c.name.toUpperCase()}</div>
          <div class="s-team">${driversStr}</div>
        </div>
        <div class="s-pts">${c.points}</div>
        <div class="s-gap">${gap}</div>
      `;
      container.appendChild(row);
    });

    const btn = document.createElement('button');
    btn.className = 'expand-btn' + (expanded ? ' expanded' : '');
    btn.innerHTML = expanded
      ? `SHOW LESS <span class="expand-arrow">▼</span>`
      : `SHOW ALL ${constructors.length} TEAMS <span class="expand-arrow">▼</span>`;
    btn.addEventListener('click', () => { expanded = !expanded; build(); });
    container.appendChild(btn);
  }

  build();
}

/* ─── PREDICTOR ──────────────────────────────────────────── */
function initPredictor() {
  // Populate track selector
  const sel = document.getElementById('pred-track');
  GRIDIQ_DATABASE.races.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `${r.flag} ${r.name}`;
    sel.appendChild(opt);
  });

  // Default to next race
  const next = getNextRace();
  if (next) sel.value = next.id;

  // Weather toggles
  document.querySelectorAll('.wx-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.wx-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.predictor.weather = btn.dataset.wx;
    });
  });

  // Penalty inputs — show top 8 by default, expandable to all 22
  const PENALTY_DEFAULT = 8;
  const penGrid   = document.getElementById('penalty-inputs');
  const allDrivers = [...GRIDIQ_DATABASE.drivers].sort((a,b) => b.points - a.points);

  function buildPenaltyRows() {
    penGrid.innerHTML = '';
    const visible = STATE.predictor.penaltiesExpanded ? allDrivers : allDrivers.slice(0, PENALTY_DEFAULT);
    visible.forEach(d => {
      const row = document.createElement('div');
      row.className = 'pen-row';
      row.innerHTML = `
        <div class="pen-driver">${d.lastName.toUpperCase()}</div>
        <input class="pen-input" type="number" min="0" max="20" value="0"
               data-driver="${d.id}" placeholder="0">
        <div class="pen-lbl">POS</div>
      `;
      penGrid.appendChild(row);
    });

    // Expand/collapse button
    const remaining = allDrivers.length - PENALTY_DEFAULT;
    const btn = document.createElement('button');
    btn.className = 'expand-btn' + (STATE.predictor.penaltiesExpanded ? ' expanded' : '');
    btn.style.gridColumn = '1 / -1';
    btn.innerHTML = STATE.predictor.penaltiesExpanded
      ? `SHOW LESS <span class="expand-arrow">▼</span>`
      : `SHOW ALL ${allDrivers.length} DRIVERS <span class="expand-arrow">▼</span>`;
    btn.addEventListener('click', () => {
      STATE.predictor.penaltiesExpanded = !STATE.predictor.penaltiesExpanded;
      buildPenaltyRows();
    });
    penGrid.appendChild(btn);
  }

  buildPenaltyRows();
  document.getElementById('run-sim').addEventListener('click', runSimulation);
}

function runSimulation() {
  const trackId = document.getElementById('pred-track').value;
  const track   = getRace(trackId);
  const weather = STATE.predictor.weather;

  // Collect penalties
  const penalties = {};
  document.querySelectorAll('.pen-input').forEach(inp => {
    const val = parseInt(inp.value) || 0;
    if (val > 0) penalties[inp.dataset.driver] = val;
  });

  // Score each driver
  const scored = GRIDIQ_DATABASE.drivers.map(driver => {
    const cons = getConstructor(driver.constructorId);

    // Base: driver overall (0-100) + constructor weight (0-6)
    let score = driver.rating.overall * 0.65 + cons.rating * 0.35;

    // Track-type modifier
    if (track.trackType === 'power') {
      score += (driver.rating.power - 84) * 0.25;
      score += (cons.rating - 85) * 0.20;
    } else if (track.trackType === 'technical') {
      score += (driver.rating.technical - 84) * 0.28;
      score -= (driver.rating.power - 84) * 0.05;
    } else { // balanced
      score += (driver.rating.technical + driver.rating.power) / 2 * 0.12;
    }

    // Weather modifier
    if (weather === 'wet') {
      score += (driver.rating.wet - 80) * 0.45;
    } else if (weather === 'mixed') {
      score += (driver.rating.wet - 80) * 0.20;
    }

    // 2026 Active Aero modifier
    if (track.preferredAeroMode === 'X') {
      // X-mode (low drag) benefits power tracks — boost high-rated power units
      score += (cons.rating - 85) * 0.15;
    } else {
      // Z-mode (max downforce) benefits technical circuits — boost driver skill
      score += (driver.rating.technical - 82) * 0.15;
    }

    // 2026 Power Split bonus: Mercedes & Ferrari leading ERS development this season
    const topERS = ['mercedes','ferrari','mclaren'];
    if (topERS.includes(driver.constructorId)) score += 3.5;
    // Honda/RBP struggling with 50/50 split adaptation in 2026
    const hondaStruggle = ['red_bull','racing_bulls','aston_martin'];
    if (hondaStruggle.includes(driver.constructorId)) score -= 2.0;

    // Racecraft bonus
    score += (driver.rating.racecraft - 80) * 0.10;

    // Grid penalty
    if (penalties[driver.id]) {
      score -= penalties[driver.id] * 1.8;
    }

    // Controlled randomness (±3.5 for racing unpredictability)
    score += (Math.random() * 7) - 3.5;

    return { driver, score: Math.round(score * 10) / 10 };
  });

  const results = scored
    .sort((a,b) => b.score - a.score)
    .slice(0, 10);

  renderSimResults(results, track, weather);
}

function renderSimResults(results, track, weather) {
  const container = document.getElementById('sim-results');
  const list      = document.getElementById('results-grid');
  const idle      = document.getElementById('pred-idle');
  container.classList.remove('hidden');
  if (idle) idle.style.display = 'none';

  list.innerHTML = '';
  results.forEach((r, i) => {
    const posClass = ['rp1','rp2','rp3'][i] || 'rpn';
    const row = document.createElement('div');
    row.className = 'res-row';
    row.innerHTML = `
      <div class="res-pos ${posClass}">${i === 0 ? '🏆' : `P${i+1}`}</div>
      <div class="res-dot" style="background:${r.driver.color}"></div>
      <div class="res-info">
        <div class="res-name">${r.driver.firstName} ${r.driver.lastName}</div>
        <div class="res-team">${getConstructor(r.driver.constructorId).shortName}</div>
      </div>
      <div class="res-score">${r.score.toFixed(1)}</div>
    `;
    list.appendChild(row);
  });

  // Regulation insight
  const winner = results[0].driver;
  const winTeam = getConstructor(winner.constructorId);
  const wxText = weather === 'wet' ? '🌧️ Wet conditions amplified <em>wet-weather specialists</em>. ' :
                 weather === 'mixed' ? '⛅ Mixed conditions rewarded <em>adaptable tire managers</em>. ' : '';
  const aeroText = track.preferredAeroMode === 'X'
    ? `<strong>X-Mode aero</strong> (low drag) dominated ${track.name} — straight-line speed was decisive on this ${track.trackType} layout.`
    : `<strong>Z-Mode aero</strong> (maximum downforce) defined the lap time at ${track.name} — corner entry speed separated the field.`;
  const powerText = `Under <strong>2026's 50/50 Power Split</strong>, the electric motor deployment in zones ${track.drsZones > 2 ? 'proved critical across ' + track.drsZones + ' DRS zones' : 'was felt through every acceleration point'}.`;

  document.getElementById('reg-insight').innerHTML = `
    <div class="insight-lbl">SIM ANALYSIS — 2026 REGS</div>
    <div class="insight-body">
      ${wxText}${aeroText} ${powerText}
      ${results[0].driver.id !== results[1].driver.id
        ? ` <strong>${winner.firstName} ${winner.lastName}</strong> (${winTeam.shortName}) leads with a score of ${results[0].score.toFixed(1)} — ${winner.rating.racecraft >= 92 ? 'elite racecraft' : 'strong track fit'} proved decisive.`
        : ''}
    </div>
  `;

  // On mobile only, scroll results into view
  if (window.innerWidth < 768) {
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/* ─── FANTASY ────────────────────────────────────────────── */
function calcBudgetUsed() {
  return STATE.fantasy.slots.reduce((total, slot) => {
    if (!slot.id) return total;
    const entity = slot.type === 'driver' ? getDriver(slot.id) : getConstructor(slot.id);
    return total + (entity ? entity.price : 0);
  }, 0);
}

function updateBudgetDisplay() {
  const used = calcBudgetUsed();
  const left = 100 - used;
  const pct  = Math.min((used / 100) * 100, 100);

  document.getElementById('budget-used').textContent  = used.toFixed(1);
  document.getElementById('budget-left').textContent  = left.toFixed(1);
  document.getElementById('budget-remaining').textContent = left.toFixed(1);
  document.getElementById('budget-bar').style.width   = pct + '%';

  const statsEl = document.querySelector('.budget-stats');
  if (left < 0) {
    statsEl.querySelectorAll('span')[1].classList.add('over');
  } else {
    statsEl.querySelectorAll('span')[1].classList.remove('over');
  }
}

function renderLineupSlots() {
  const container = document.getElementById('my-lineup');
  container.innerHTML = '';
  STATE.fantasy.slots.forEach((slot, i) => {
    const div = document.createElement('div');
    div.className = 'l-slot' + (slot.id ? ' filled' : '');

    if (slot.id) {
      const entity = slot.type === 'driver' ? getDriver(slot.id) : getConstructor(slot.id);
      const color  = entity.color;
      const subtext = slot.type === 'driver'
        ? getConstructor(entity.constructorId).shortName
        : entity.engine;
      div.innerHTML = `
        <div class="slot-badge ${slot.type==='constructor'?'team':''}">${slot.label}</div>
        <div class="l-dot" style="width:7px;height:7px;border-radius:50%;background:${color};flex-shrink:0"></div>
        <div class="slot-info">
          <div class="slot-name">${slot.type==='driver' ? entity.firstName+' '+entity.lastName : entity.name}</div>
          <div class="slot-sub">${subtext} · $${entity.price.toFixed(1)}M</div>
        </div>
        <div class="slot-price">$${entity.price.toFixed(1)}M</div>
        <button class="slot-remove" data-slot="${i}">✕</button>
      `;
      div.querySelector('.slot-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        STATE.fantasy.slots[i].id = null;
        renderLineupSlots();
        renderPPMTable();
        updateBudgetDisplay();
      });
    } else {
      div.innerHTML = `
        <div class="slot-badge ${slot.type==='constructor'?'team':''}">${slot.label}</div>
        <div class="slot-info">
          <div class="slot-empty">TAP TO SELECT ${slot.type==='constructor'?'CONSTRUCTOR':'DRIVER'}</div>
        </div>
        <div style="color:var(--text-3);font-size:18px">+</div>
      `;
      div.addEventListener('click', () => openPickerModal(i));
    }

    container.appendChild(div);
  });
}

function calcPPM(entity) {
  return entity.price > 0 ? (entity.points / entity.price) : 0;
}

function renderPPMTable() {
  const f = STATE.fantasy.ppmFilter;
  const allItems = [
    ...GRIDIQ_DATABASE.drivers.map(d => ({ ...d, entityType:'driver' })),
    ...GRIDIQ_DATABASE.constructors.map(c => ({ ...c, entityType:'constructor' }))
  ]
  .filter(item => f === 'all' || item.entityType === f)
  .sort((a,b) => calcPPM(b) - calcPPM(a));

  const inLineup = STATE.fantasy.slots.filter(s => s.id).map(s => s.id);
  const container = document.getElementById('ppm-table');
  container.innerHTML = '';

  allItems.forEach((item, i) => {
    const ppm    = calcPPM(item).toFixed(2);
    const isIn   = inLineup.includes(item.id);
    const subtext = item.entityType === 'driver'
      ? getConstructor(item.constructorId).shortName
      : item.engine;

    const row = document.createElement('div');
    row.className = 'ppm-row';
    row.innerHTML = `
      <div class="ppm-rank">${i+1}</div>
      <div class="ppm-bar" style="background:${item.color}"></div>
      <div class="ppm-info">
        <div class="ppm-name">${item.entityType==='driver' ? item.firstName+' '+item.lastName : item.name}</div>
        <div class="ppm-meta">${subtext} · ${item.entityType==='driver'?'Driver':'Constructor'}</div>
      </div>
      <div class="ppm-right">
        <div class="ppm-score">${ppm}</div>
        <div class="ppm-score-lbl">PPM</div>
        <div class="ppm-price-lbl">$${item.price.toFixed(1)}M</div>
      </div>
      <button class="ppm-add ${isIn?'in-lineup':''}" data-id="${item.id}" data-type="${item.entityType}">
        ${isIn ? '✓ IN' : '+ ADD'}
      </button>
    `;

    row.querySelector('.ppm-add').addEventListener('click', () => {
      if (isIn) return;
      autoAddToLineup(item.id, item.entityType);
    });

    container.appendChild(row);
  });
}

function autoAddToLineup(id, type) {
  const entity = type === 'driver' ? getDriver(id) : getConstructor(id);
  const used   = calcBudgetUsed();

  // Find first empty slot of the right type
  const slotIdx = STATE.fantasy.slots.findIndex(s => s.type === type && !s.id);
  if (slotIdx === -1) {
    showToast(`No empty ${type} slots — remove one first`);
    return;
  }
  if (used + entity.price > 100) {
    showToast(`Over $100M budget cap`);
    return;
  }

  STATE.fantasy.slots[slotIdx].id = id;
  renderLineupSlots();
  renderPPMTable();
  updateBudgetDisplay();
}

function openPickerModal(slotIdx) {
  STATE.fantasy.pickerSlot = slotIdx;
  const slotType = STATE.fantasy.slots[slotIdx].type;
  const usedBudget = calcBudgetUsed();
  const usedIds = STATE.fantasy.slots.filter(s => s.id).map(s => s.id);

  const items = slotType === 'driver'
    ? GRIDIQ_DATABASE.drivers
    : GRIDIQ_DATABASE.constructors;

  let html = `
    <div class="modal-handle"></div>
    <div class="modal-inner">
      <div style="font-family:var(--font-tech);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text);margin-bottom:14px">
        SELECT ${slotType.toUpperCase()}
      </div>
      <input class="picker-search" id="picker-search" placeholder="Search…" autocomplete="off">
      <div class="picker-list" id="picker-list">
  `;

  items
    .sort((a,b) => b.points - a.points)
    .forEach(item => {
      const budget = 100 - usedBudget;
      const subtext = slotType === 'driver'
        ? getConstructor(item.constructorId).shortName
        : item.engine;
      const isTaken = usedIds.includes(item.id);
      const tooExpensive = item.price > budget;

      html += `
        <div class="picker-item ${(isTaken||tooExpensive)?'picker-taken':''}" data-id="${item.id}">
          <div class="picker-dot" style="background:${item.color}"></div>
          <div class="picker-info">
            <div class="picker-name">${slotType==='driver'? item.firstName+' '+item.lastName : item.name}</div>
            <div class="picker-sub">${subtext} · ${item.points}pts${tooExpensive?' · OVER BUDGET':''}</div>
          </div>
          <div class="picker-price">$${item.price.toFixed(1)}M</div>
        </div>
      `;
    });

  html += '</div></div>';

  openModal(html);

  // Bind picker clicks
  document.querySelectorAll('.picker-item:not(.picker-taken)').forEach(el => {
    el.addEventListener('click', () => {
      STATE.fantasy.slots[STATE.fantasy.pickerSlot].id = el.dataset.id;
      closeModal();
      renderLineupSlots();
      renderPPMTable();
      updateBudgetDisplay();
    });
  });

  // Search
  document.getElementById('picker-search').addEventListener('input', function() {
    const q = this.value.toLowerCase();
    document.querySelectorAll('.picker-item').forEach(el => {
      const name = el.querySelector('.picker-name').textContent.toLowerCase();
      el.style.display = name.includes(q) ? '' : 'none';
    });
  });
}

function optimizeLineup() {
  // Reset all slots
  STATE.fantasy.slots.forEach(s => s.id = null);

  // Build candidate pool with PPM scores
  const driverCandidates = [...GRIDIQ_DATABASE.drivers]
    .map(d => ({ ...d, entityType:'driver', ppm: calcPPM(d) }))
    .sort((a,b) => b.ppm - a.ppm);

  const consCandidates = [...GRIDIQ_DATABASE.constructors]
    .map(c => ({ ...c, entityType:'constructor', ppm: calcPPM(c) }))
    .sort((a,b) => b.ppm - a.ppm);

  // Greedy algorithm: pick best 5 drivers + 2 constructors within $100M
  let budget = 100;
  let drivers_picked = [];
  let cons_picked = [];

  // Try combinations: greedy from top, but ensure budget fits
  for (const d of driverCandidates) {
    if (drivers_picked.length >= 5) break;
    if (d.price <= budget - (2 * consCandidates[0].price) - ((4 - drivers_picked.length) * driverCandidates[driverCandidates.length-1].price)) {
      drivers_picked.push(d);
      budget -= d.price;
    }
  }

  // If greedy failed, fallback: just pick cheapest that fit
  if (drivers_picked.length < 5) {
    budget = 100;
    drivers_picked = [];
    for (const d of [...driverCandidates].sort((a,b) => b.ppm - a.ppm)) {
      if (drivers_picked.length >= 5) break;
      if (budget - d.price >= 0) {
        drivers_picked.push(d);
        budget -= d.price;
      }
    }
  }

  for (const c of consCandidates) {
    if (cons_picked.length >= 2) break;
    if (budget - c.price >= 0) {
      cons_picked.push(c);
      budget -= c.price;
    }
  }

  drivers_picked.forEach((d, i) => { STATE.fantasy.slots[i].id = d.id; });
  cons_picked.forEach((c, i) => { STATE.fantasy.slots[5+i].id = c.id; });

  renderLineupSlots();
  renderPPMTable();
  updateBudgetDisplay();
  showToast('⚡ Optimal lineup generated!');
}

/* ─── F1 GUIDE — TEAMS ───────────────────────────────────── */
function renderGuideTeams() {
  const el = document.getElementById('guide-teams-grid');
  if (!el) return;
  const teams = [...GRIDIQ_DATABASE.constructors].sort((a, b) => b.points - a.points);
  el.innerHTML = teams.map((c, i) => {
    const driverNames = c.drivers.map(id => {
      const d = getDriver(id);
      return d ? d.lastName : id;
    });
    const driverPills = driverNames.map(n =>
      `<span class="guide-team-driver-pill">${n.toUpperCase()}</span>`
    ).join('');
    return `
      <div class="guide-team-card" style="border-left-color:${c.color}">
        <div class="guide-team-header">
          <div class="guide-team-dot" style="background:${c.color}"></div>
          <div>
            <div class="guide-team-name">${c.name.toUpperCase()}</div>
            <div class="guide-team-engine-lbl">${c.engine} power unit</div>
          </div>
          <div class="guide-team-pos-chip">P${i + 1}</div>
        </div>
        <div class="guide-team-drivers">${driverPills}</div>
        <div class="guide-team-pts-row">
          <span class="guide-team-pts">${c.points}</span>
          <span class="guide-team-pts-lbl">&nbsp;PTS</span>
        </div>
        <div class="guide-team-desc">${c.desc}</div>
      </div>`;
  }).join('');
}

/* ─── WELCOME MODAL ──────────────────────────────────────── */
function maybeShowWelcomeModal() {
  if (localStorage.getItem('gridiq_welcomed')) return;
  setTimeout(function() {
    var proModal = document.getElementById('pro-modal');
    if (proModal && !proModal.classList.contains('hidden')) return;
    const modal = document.getElementById('welcome-modal');
    if (modal) modal.classList.remove('hidden');
    sessionStorage.setItem('gridiq_promo_shown', '1');
  }, 3000);
}

function closeWelcomeModal() {
  const modal = document.getElementById('welcome-modal');
  if (modal) modal.classList.add('hidden');
  localStorage.setItem('gridiq_welcomed', '1');
}

/* ─── MORE PAGE ──────────────────────────────────────────── */
function renderCalendar() {
  const nextRace  = getNextRace();
  const container = document.getElementById('full-calendar');
  container.innerHTML = '';

  const completed = GRIDIQ_DATABASE.races.filter(r => r.status === 'completed');
  const upcoming  = GRIDIQ_DATABASE.races.filter(r => r.status !== 'completed');

  function makeRow(r) {
    const isPast = r.status === 'completed';
    const isNext = r.id === nextRace.id;
    const row = document.createElement('div');
    row.className = `cal-row${isPast ? ' past' : ''}${isNext ? ' next' : ''}`;
    row.innerHTML = `
      <div class="cal-rnd">R${r.round}</div>
      <div class="cal-info">
        <div class="cal-name">${r.flag} ${r.country}</div>
        <div class="cal-circuit">${isPast && r.winner ? `✓ Won by ${r.winner}` : r.circuit}</div>
      </div>
      <div class="cal-date-col">
        <div class="cal-date">${formatDate(r.date)}</div>
        ${isNext ? '<div class="next-badge">NEXT</div>' : ''}
      </div>
    `;
    return row;
  }

  // Group label: COMPLETED
  if (completed.length) {
    const lbl = document.createElement('div');
    lbl.className = 'cal-group-lbl';
    lbl.textContent = `COMPLETED — ${completed.length} ROUNDS`;
    container.appendChild(lbl);
    completed.forEach(r => container.appendChild(makeRow(r)));
  }

  // Group label: UPCOMING
  if (upcoming.length) {
    const lbl = document.createElement('div');
    lbl.className = 'cal-group-lbl';
    lbl.textContent = `UPCOMING — ${upcoming.length} ROUNDS`;
    container.appendChild(lbl);
    upcoming.forEach(r => container.appendChild(makeRow(r)));
  }
}

/* ─── MODAL SYSTEM ───────────────────────────────────────── */
function openModal(html) {
  const overlay = document.getElementById('custom-modal');
  document.getElementById('modal-box').innerHTML =
    `<button class="modal-close-btn" onclick="closeModal()">✕</button>` + html;
  overlay.classList.remove('hidden');
  STATE.modal.open = true;
}

function closeModal() {
  document.getElementById('custom-modal').classList.add('hidden');
  STATE.modal.open = false;
}

document.getElementById('custom-modal').addEventListener('click', (e) => {
  if (e.target.id === 'custom-modal') closeModal();
});

/* ─── DRIVER MODAL ───────────────────────────────────────── */
function openDriverModal(driverId) {
  const d = getDriver(driverId);
  const cons = getConstructor(d.constructorId);

  const html = `
    <div class="modal-handle"></div>
    <div class="modal-inner">
      <div class="m-num">${d.number}</div>
      <div class="m-dname">${d.firstName.toUpperCase()}<br>${d.lastName.toUpperCase()}</div>
      <div class="m-team">
        <div class="m-team-dot" style="background:${d.color}"></div>
        <div class="m-team-name">${cons.name} · #${d.number}</div>
      </div>
      <div class="m-stats">
        <div class="m-stat">
          <div class="m-stat-lbl">NATIONALITY</div>
          <div class="m-stat-val">${d.nationality}</div>
        </div>
        <div class="m-stat">
          <div class="m-stat-lbl">BIRTHPLACE</div>
          <div class="m-stat-val" style="font-size:12px">${d.birthplace}</div>
        </div>
        <div class="m-stat">
          <div class="m-stat-lbl">DATE OF BIRTH</div>
          <div class="m-stat-val" style="font-size:12px">${d.born}</div>
        </div>
        <div class="m-stat">
          <div class="m-stat-lbl">F1 DEBUT</div>
          <div class="m-stat-val" style="font-size:12px">${d.debut}</div>
        </div>
        <div class="m-stat">
          <div class="m-stat-lbl">CHAMPIONSHIPS</div>
          <div class="m-stat-val">${d.championships}</div>
        </div>
        <div class="m-stat">
          <div class="m-stat-lbl">RACE WINS</div>
          <div class="m-stat-val">${d.wins}</div>
        </div>
        <div class="m-stat">
          <div class="m-stat-lbl">POLE POSITIONS</div>
          <div class="m-stat-val">${d.poles}</div>
        </div>
        <div class="m-stat">
          <div class="m-stat-lbl">2026 POINTS</div>
          <div class="m-stat-val" style="color:var(--accent)">${d.points}</div>
        </div>
      </div>
      <div style="margin-bottom:12px">
        <div style="font-family:var(--font-tech);font-size:10px;letter-spacing:2px;color:var(--text-2);margin-bottom:8px">DRIVER RATINGS</div>
        ${renderRatingBars(d.rating)}
      </div>
      <div class="m-divider"></div>
      <div class="m-bio">${d.bio}</div>
    </div>
  `;
  openModal(html);
}

function renderRatingBars(rating) {
  const metrics = [
    { key:'overall',   label:'OVERALL' },
    { key:'wet',       label:'WET' },
    { key:'technical', label:'TECHNICAL' },
    { key:'power',     label:'POWER' },
    { key:'racecraft', label:'RACECRAFT' }
  ];
  return metrics.map(m => `
    <div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-2);font-family:var(--font-tech);letter-spacing:1px;margin-bottom:4px">
        <span>${m.label}</span><span>${rating[m.key]}</span>
      </div>
      <div style="height:3px;background:rgba(255,255,255,.07);border-radius:2px;overflow:hidden">
        <div style="height:100%;width:${rating[m.key]}%;background:var(--accent);border-radius:2px"></div>
      </div>
    </div>
  `).join('');
}

/* ─── TOAST NOTIFICATION ─────────────────────────────────── */
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position:fixed;bottom:20px;left:50%;transform:translateX(-50%);
      background:#1a1a1a;border:1px solid var(--border-red);border-radius:20px;
      color:var(--text);font-family:var(--font-tech);font-size:11px;letter-spacing:1px;
      padding:8px 18px;z-index:300;opacity:0;transition:opacity .2s;white-space:nowrap;
      max-width:calc(100vw - 32px);
    `;
    document.getElementById('app').appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

/* ─── HEAD-TO-HEAD COMPARE ───────────────────────────────── */
function initCompare() {
  const selA = document.getElementById('compare-sel-a');
  const selB = document.getElementById('compare-sel-b');
  if (!selA || !selB) return;

  const opts = GRIDIQ_DATABASE.drivers
    .slice()
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
    .map(d => `<option value="${d.id}">${d.firstName} ${d.lastName}</option>`)
    .join('');
  selA.innerHTML = opts;
  selB.innerHTML = opts;

  // Default: top 2 by points
  const sorted = GRIDIQ_DATABASE.drivers.slice().sort((a, b) => b.points - a.points);
  if (sorted[0]) selA.value = sorted[0].id;
  if (sorted[1]) selB.value = sorted[1].id;

  renderCompare();
  selA.addEventListener('change', renderCompare);
  selB.addEventListener('change', renderCompare);
}

function renderCompare() {
  const selA = document.getElementById('compare-sel-a');
  const selB = document.getElementById('compare-sel-b');
  if (!selA || !selB) return;
  const dA = getDriver(selA.value);
  const dB = getDriver(selB.value);
  if (!dA || !dB) return;
  _renderCompareBadge('compare-badge-a', dA, '#FF1E00');
  _renderCompareBadge('compare-badge-b', dB, '#00D2BE');
  _renderCompareRadar(dA, dB);
  _renderCompareStats(dA, dB);
}

function _renderCompareBadge(id, d, color) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML =
    `<span class="compare-badge-dot" style="background:${color}"></span>` +
    `<span class="compare-badge-name">${d.lastName.toUpperCase()}</span>` +
    `<span class="compare-badge-team">${d.constructor}</span>`;
}

function _renderCompareRadar(dA, dB) {
  const el = document.getElementById('compare-radar');
  if (!el) return;

  const keys   = ['overall', 'wet', 'technical', 'power', 'racecraft'];
  const labels = ['OVERALL', 'WET', 'TECHNICAL', 'POWER', 'RACECRAFT'];
  const n = keys.length;
  const cx = 150, cy = 158, r = 100;
  const colorA = '#FF1E00', colorB = '#00D2BE';
  const RADAR_MIN = 70, RADAR_MAX = 100;

  const norm = v => Math.max(0, Math.min(1, (v - RADAR_MIN) / (RADAR_MAX - RADAR_MIN)));

  const pt = (val, i) => {
    const angle = (i * 2 * Math.PI / n) - Math.PI / 2;
    return `${(cx + r * val * Math.cos(angle)).toFixed(1)},${(cy + r * val * Math.sin(angle)).toFixed(1)}`;
  };

  const gridPolys = [0.25, 0.5, 0.75, 1.0].map(f =>
    `<polygon points="${keys.map((_, i) => pt(f, i)).join(' ')}" class="radar-grid"/>`
  ).join('');

  const axes = keys.map((_, i) => {
    const angle = (i * 2 * Math.PI / n) - Math.PI / 2;
    return `<line x1="${cx}" y1="${cy}" x2="${(cx + r * Math.cos(angle)).toFixed(1)}" y2="${(cy + r * Math.sin(angle)).toFixed(1)}" class="radar-axis"/>`;
  }).join('');

  const polyA = `<polygon points="${keys.map((k, i) => pt(norm(dA.rating[k] || 0), i)).join(' ')}" class="radar-poly" style="fill:${colorA}28;stroke:${colorA}"/>`;
  const polyB = `<polygon points="${keys.map((k, i) => pt(norm(dB.rating[k] || 0), i)).join(' ')}" class="radar-poly" style="fill:${colorB}28;stroke:${colorB}"/>`;

  const lbls = labels.map((lbl, i) => {
    const angle = (i * 2 * Math.PI / n) - Math.PI / 2;
    const lr = r + 20;
    const x = (cx + lr * Math.cos(angle)).toFixed(1);
    const y = (cy + lr * Math.sin(angle)).toFixed(1);
    const anchor = Math.cos(angle) > 0.15 ? 'start' : Math.cos(angle) < -0.15 ? 'end' : 'middle';
    const dy = Math.sin(angle) < -0.1 ? '-0.4em' : '0.85em';
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" dy="${dy}" class="radar-label">${lbl}</text>`;
  }).join('');

  const legend =
    `<rect x="20" y="14" width="14" height="3" rx="1.5" fill="${colorA}"/>` +
    `<text x="40" y="19" class="radar-legend">${dA.lastName.toUpperCase()}</text>` +
    `<rect x="160" y="14" width="14" height="3" rx="1.5" fill="${colorB}"/>` +
    `<text x="180" y="19" class="radar-legend">${dB.lastName.toUpperCase()}</text>`;

  el.innerHTML =
    `<svg viewBox="0 0 300 308" xmlns="http://www.w3.org/2000/svg" class="radar-svg">` +
    gridPolys + axes + polyA + polyB + lbls + legend +
    `</svg>`;
}

function _renderCompareStats(dA, dB) {
  const el = document.getElementById('compare-stats');
  if (!el) return;

  const ratingKeys   = ['overall', 'wet', 'technical', 'power', 'racecraft'];
  const ratingLabels = ['OVERALL', 'WET', 'TECHNICAL', 'POWER', 'RACECRAFT'];
  const careerKeys   = ['wins', 'poles', 'podiums', 'points', 'championships'];
  const careerLabels = ['WINS', 'POLES', 'PODIUMS', 'POINTS', 'CHAMPS'];

  function buildCard(d) {
    const dotColor = d.color || '#FF1E00';

    const careerRows = careerKeys.map((k, i) => {
      return `<div class="cdc-stat-row">
        <span class="cdc-stat-lbl">${careerLabels[i]}</span>
        <span class="cdc-stat-val">${d[k] || 0}</span>
      </div>`;
    }).join('');

    const ratingRows = ratingKeys.map((k, i) => {
      return `<div class="cdc-stat-row">
        <span class="cdc-stat-lbl">${ratingLabels[i]}</span>
        <span class="cdc-stat-val">${d.rating[k] || 0}</span>
      </div>`;
    }).join('');

    return `<div class="cdc-card">
      <div class="cdc-card-header">
        <span class="cdc-dot" style="background:${dotColor}"></span>
        <div class="cdc-names">
          <span class="cdc-driver-name">${d.lastName.toUpperCase()}</span>
          <span class="cdc-team-name">${d.constructor}</span>
        </div>
      </div>
      <div class="cdc-section-label">CAREER</div>
      ${careerRows}
      <div class="cdc-section-label cdc-section-label--ratings">RATINGS</div>
      ${ratingRows}
    </div>`;
  }

  el.innerHTML = `<div class="cdc-grid">${buildCard(dA)}${buildCard(dB)}</div>`;
}

/* ─── INIT ───────────────────────────────────────────────── */
function init() {
  renderHeroStats();
  renderRaceHero();
  renderChampionshipHub();
  if (typeof initSmoke === 'function') initSmoke();
  renderConstructorStandings();
  renderDriverStandings();
  initPredictor();
  initCompare();
  renderLineupSlots();
  renderPPMTable();
  updateBudgetDisplay();
  renderCalendar();
  renderGuideTeams();
  maybeShowWelcomeModal();

  // ── Welcome modal buttons ───────────────────────────────
  const welcomeNewBtn = document.getElementById('welcome-new-btn');
  if (welcomeNewBtn) welcomeNewBtn.addEventListener('click', function() {
    closeWelcomeModal();
    switchTab('more');
  });
  const welcomeSkipBtn = document.getElementById('welcome-skip-btn');
  if (welcomeSkipBtn) welcomeSkipBtn.addEventListener('click', closeWelcomeModal);
  const welcomeModal = document.getElementById('welcome-modal');
  if (welcomeModal) welcomeModal.addEventListener('click', function(e) {
    if (e.target === welcomeModal) closeWelcomeModal();
  });

  document.getElementById('optimize-btn').addEventListener('click', optimizeLineup);

  // ── Hero CTA buttons ────────────────────────────────────
  document.querySelectorAll('.btn-hero-primary, .btn-hero-outline').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // ── Hamburger menu toggle ───────────────────────────────
  const hamburger = document.getElementById('nav-hamburger');
  const topNav = document.getElementById('top-nav');
  hamburger.addEventListener('click', () => {
    const isOpen = topNav.classList.toggle('nav-open');
    hamburger.textContent = isOpen ? '✕' : '☰';
  });

// ── Inner tabs: standings switcher on Home ──────────────
  document.querySelectorAll('.inner-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const group = btn.closest('.inner-tabs').parentElement;
      group.querySelectorAll('.inner-tab').forEach(b => b.classList.remove('active'));
      group.querySelectorAll('.inner-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // ── PPM filter pills ────────────────────────────────────
  document.querySelectorAll('#ppm-filter-pills .filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#ppm-filter-pills .filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.fantasy.ppmFilter = btn.dataset.filter;
      renderPPMTable();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && STATE.modal.open) closeModal();
  });
}

document.addEventListener('DOMContentLoaded', init);
