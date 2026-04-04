/* ============================================================
   GridIQ — Live Data  |  live-data.js

   Fetches current F1 standings + race results from the Jolpica
   API (free, no key needed) and patches GRIDIQ_DATABASE in
   memory before the app renders. Falls back silently to the
   hardcoded database.js values if the network is unavailable.
   ============================================================ */

/* ── Constructor ID mapping (Jolpica → GridIQ DB) ──────────── */
var CONSTRUCTOR_MAP = {
  'kick_sauber': 'audi',        // Jolpica may use old Sauber name
  'rb':          'racing_bulls' // Jolpica 2025 id for Racing Bulls
};

function mapCtor(id) {
  return CONSTRUCTOR_MAP[id] || id;
}


/* ── Fetch with abort timeout ───────────────────────────────── */
function fetchWithTimeout(url, ms) {
  var ctrl = new AbortController();
  var t = setTimeout(function() { ctrl.abort(); }, ms);
  return fetch(url, { signal: ctrl.signal }).finally(function() { clearTimeout(t); });
}

/* ── Patch: driver standings ────────────────────────────────── */
function applyDriverStandings(data) {
  var list = data &&
    data.MRData &&
    data.MRData.StandingsTable &&
    data.MRData.StandingsTable.StandingsLists &&
    data.MRData.StandingsTable.StandingsLists[0] &&
    data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
  if (!list) return;

  list.forEach(function(entry) {
    var code = entry.Driver && entry.Driver.code;
    var driver = GRIDIQ_DATABASE.drivers.find(function(d) { return d.id === code; });
    if (!driver) return;
    driver.points = parseInt(entry.points, 10) || driver.points;
    driver.wins   = parseInt(entry.wins,   10) || driver.wins;
  });
}

/* ── Patch: constructor standings ───────────────────────────── */
function applyConstructorStandings(data) {
  var list = data &&
    data.MRData &&
    data.MRData.StandingsTable &&
    data.MRData.StandingsTable.StandingsLists &&
    data.MRData.StandingsTable.StandingsLists[0] &&
    data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
  if (!list) return;

  list.forEach(function(entry) {
    var jolpicaId = entry.Constructor && entry.Constructor.constructorId;
    var ctor = GRIDIQ_DATABASE.constructors.find(function(c) { return c.id === mapCtor(jolpicaId); });
    if (!ctor) return;
    ctor.points = parseInt(entry.points, 10) || ctor.points;
  });
}

/* ── Patch: race results ────────────────────────────────────── */
function applyRaceResults(data) {
  var races = data && data.MRData && data.MRData.RaceTable && data.MRData.RaceTable.Races;
  if (!Array.isArray(races)) return;

  races.forEach(function(apiRace) {
    var round = parseInt(apiRace.round, 10);
    var dbRace = GRIDIQ_DATABASE.races.find(function(r) { return r.round === round; });
    if (!dbRace) return;
    var p1 = apiRace.Results && apiRace.Results.find(function(r) { return r.position === '1'; });
    if (p1) {
      dbRace.status = 'completed';
      dbRace.winner = (p1.Driver && p1.Driver.familyName) || dbRace.winner;
    }
  });

  /* Recount from status field so racesCompleted stays in sync */
  GRIDIQ_DATABASE.racesCompleted = GRIDIQ_DATABASE.races.filter(function(r) {
    return r.status === 'completed';
  }).length;
}

/* ── LIVE badge ─────────────────────────────────────────────── */
function showLiveBadge() {
  if (document.getElementById('live-data-badge')) return;
  var brand = document.querySelector('.nav-brand');
  if (!brand) return;

  var badge = document.createElement('span');
  badge.id = 'live-data-badge';
  badge.style.cssText = [
    'display:inline-flex',
    'align-items:center',
    'gap:4px',
    'font-family:var(--font-tech)',
    'font-size:8px',
    'letter-spacing:1.5px',
    'color:var(--accent)',
    'border:1px solid var(--border-red)',
    'padding:3px 7px',
    'border-radius:20px',
    'background:var(--accent-dim)',
    'margin-left:8px'
  ].join(';');

  var dot = document.createElement('span');
  dot.style.cssText = 'width:5px;height:5px;background:var(--accent);border-radius:50%;animation:pulse 1.4s ease-in-out infinite;flex-shrink:0';
  badge.appendChild(dot);
  badge.appendChild(document.createTextNode('\u00a0LIVE'));
  brand.appendChild(badge);
}

/* ── Main export ────────────────────────────────────────────── */
window.applyLiveData = function() {
  var BASE = 'https://api.jolpi.ca/ergast/f1/current';

  return Promise.allSettled([
    fetchWithTimeout(BASE + '/driverStandings.json', 5000).then(function(r) { return r.json(); }),
    fetchWithTimeout(BASE + '/constructorStandings.json', 5000).then(function(r) { return r.json(); }),
    fetchWithTimeout(BASE + '/results.json', 5000).then(function(r) { return r.json(); })
  ]).then(function(results) {
    var dRes = results[0];
    var cRes = results[1];
    var rRes = results[2];
    var ok   = false;

    if (dRes.status === 'fulfilled') { applyDriverStandings(dRes.value);     ok = true; }
    if (cRes.status === 'fulfilled') { applyConstructorStandings(cRes.value); ok = true; }
    if (rRes.status === 'fulfilled') { applyRaceResults(rRes.value);          ok = true; }

    /* LIVE badge removed */
  }).catch(function() {
    /* Swallow any unexpected error so init() always runs */
  });
};
