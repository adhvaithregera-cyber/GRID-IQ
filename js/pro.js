/* ============================================================
   GridIQ — PRO Subscription  |  pro.js
   ── ─────────────────────────────────────────────────────── */

/* ── Owner config (SHA-256 of owner email — never store plaintext) ── */
var OWNER_EMAIL_HASH = '3f3f6c85347fa6ca01e2601e1ba6bbe4bbb33652e39f12bd460073bdb0d7d136';

/* ── PRO features list (shown in upgrade modal) ─────────── */
var PRO_FEATURES = [
  { label: 'Fantasy Team Builder',      desc: '5 drivers + 2 constructors, budget cap & PPM rankings', live: true  },
  { label: 'H2H Driver Comparison',     desc: 'Radar chart comparing any two drivers across 5 axes',   live: true  },
  { label: 'Driver Form Index',         desc: 'Hot/cold streak indicator based on recent race results', live: false },
  { label: 'More features this season', desc: 'New PRO tools added throughout the 2026 season',        live: false },
];

/* ── Beta & trial config ────────────────────────────────── */
var BETA_END_DATE = '2026-11-30';
var TRIAL_DAYS    = 7;

/* ── PRO status — set ONLY by Firestore sync in auth.js ── */
var _proVerified   = false;
var _ownerVerified = false;
var _trialStart    = null;   // authoritative trial timestamp from Firestore
var _proExpiry     = null;   // subscription end timestamp from Firestore (ms)

function _setProVerified(isPro, isOwner) {
  _proVerified   = isPro   === true;
  _ownerVerified = isOwner === true;
}
window._setGridIQProVerified = _setProVerified;

function _setTrialStart(ts) {
  _trialStart = ts ? parseInt(ts, 10) : null;
}
window._setTrialStart = _setTrialStart;

function _setProExpiry(ts) {
  _proExpiry = ts ? parseInt(ts, 10) : null;
}
window._setProExpiry = _setProExpiry;

/* ─────────────────────────────────────────────────────────
   PRO STATUS
───────────────────────────────────────────────────────── */
function isGridIQPro() {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return true;
  if (window._gridiqAuthUser) {
    if (_ownerVerified) return true;
    if (_proVerified)   return true;
  }
  return _isOnActiveTrial();
}

function _isOnActiveTrial() {
  if (new Date() > new Date(BETA_END_DATE)) return false;
  // _trialStart is set by Firestore sync (authoritative). Fall back to
  // localStorage only before the first sync completes (e.g. slow network).
  var ts = _trialStart !== null ? _trialStart : parseInt(localStorage.getItem('gridiq_trial_start') || '0', 10);
  if (!ts) return false;
  return (Date.now() - ts) < TRIAL_DAYS * 86400000;
}

function isOnTrial() {
  if (_proVerified || _ownerVerified) return false;
  return _isOnActiveTrial();
}

function getTrialDaysLeft() {
  var ts = _trialStart !== null ? _trialStart : parseInt(localStorage.getItem('gridiq_trial_start') || '0', 10);
  if (!ts) return TRIAL_DAYS;
  var left = Math.ceil((TRIAL_DAYS * 86400000 - (Date.now() - ts)) / 86400000);
  return Math.max(0, left);
}

function getTrialTimeLeft() {
  var ts = _trialStart !== null ? _trialStart : parseInt(localStorage.getItem('gridiq_trial_start') || '0', 10);
  if (!ts) return '';
  var msLeft = TRIAL_DAYS * 86400000 - (Date.now() - ts);
  if (msLeft <= 0) return '0';
  var totalSec = Math.floor(msLeft / 1000);
  var d = Math.floor(totalSec / 86400);
  var h = Math.floor((totalSec % 86400) / 3600);
  var m = Math.floor((totalSec % 3600) / 60);
  var s = totalSec % 60;
  if (d > 0) return d + 'D ' + h + 'H';
  if (h > 0) return h + 'H ' + (m < 10 ? '0' : '') + m + 'M';
  return m + 'M ' + (s < 10 ? '0' : '') + s + 'S';
}

function trialAvailable() {
  if (!window._gridiqAuthUser) return false;
  if (_proVerified || _ownerVerified) return false;
  if (new Date() > new Date(BETA_END_DATE)) return false;
  // Firestore is authoritative: if _trialStart is set, trial was already used
  return _trialStart === null && !localStorage.getItem('gridiq_trial_start');
}

function startTrial() {
  if (!window._gridiqAuthUser) { openAuthModal(); return; }
  if (_trialStart !== null || localStorage.getItem('gridiq_trial_start')) return;
  var now = Date.now();
  _trialStart = now;
  localStorage.setItem('gridiq_trial_start', now.toString());
  // Persist to Firestore — write-once rule prevents users from resetting it
  if (typeof window._writeTrialStart === 'function') window._writeTrialStart(now);
  updateProNavBadge();
  closeProModal();
  showProSuccessToast('★ 7-day free trial started — full PRO access unlocked!');
}

/* ── Owner auto-grant (called from auth.js on sign-in) ──── */
async function grantOwnerProIfMatch(email) {
  if (!email) return false;
  try {
    var msgBuf  = new TextEncoder().encode(email.trim().toLowerCase());
    var hashBuf = await crypto.subtle.digest('SHA-256', msgBuf);
    var hashHex = Array.from(new Uint8Array(hashBuf))
      .map(function(b) { return b.toString(16).padStart(2, '0'); })
      .join('');
    if (hashHex === OWNER_EMAIL_HASH) {
      _setProVerified(true, true);
      localStorage.removeItem('gridiq_trial_start');
      updateProNavBadge();
      return true;
    }
  } catch (_) {}
  return false;
}

/* ─────────────────────────────────────────────────────────
   PRO MODAL
───────────────────────────────────────────────────────── */
function openProModal() {
  if (!window._gridiqAuthUser) { openAuthModal(); return; }

  var modal = document.getElementById('pro-modal');
  if (!modal) return;

  var welcomeModal = document.getElementById('welcome-modal');
  if (welcomeModal) welcomeModal.classList.add('hidden');

  // Features list
  var listEl = document.getElementById('pro-features-list');
  if (listEl) {
    listEl.innerHTML = PRO_FEATURES.map(function(f) {
      var icon = f.live
        ? '<span class="pro-check">✓</span>'
        : '<span class="pro-check pro-check--dim">✦</span>';
      return '<li>' + icon + ' <strong>' + f.label + '</strong> — ' + f.desc + '</li>';
    }).join('');
  }

  // Trial section
  var trialSection = document.getElementById('pro-trial-section');
  if (trialSection) trialSection.classList.toggle('hidden', !trialAvailable());
  var trialStartBtn = document.getElementById('pro-trial-start-btn');
  if (trialStartBtn) trialStartBtn.disabled = true;

  modal.classList.remove('hidden');
}

function closeProModal() {
  var modal = document.getElementById('pro-modal');
  if (modal) modal.classList.add('hidden');
}

/* ─────────────────────────────────────────────────────────
   PRO STATUS MODAL (shown when already PRO)
───────────────────────────────────────────────────────── */
function openProStatusModal() {
  var existing = document.getElementById('pro-status-modal');
  if (existing) { existing.remove(); return; }

  var user = window._gridiqAuthUser;
  var name = user ? (user.displayName || user.email || '') : '';

  var statusLine, expiryLine;
  if (_ownerVerified) {
    statusLine = 'OWNER ACCOUNT';
    expiryLine = 'Lifetime Access';
  } else if (isOnTrial()) {
    statusLine = 'FREE TRIAL';
    expiryLine = getTrialTimeLeft() + ' remaining';
  } else if (_proExpiry) {
    statusLine = 'ACTIVE SUBSCRIPTION';
    var expDate = new Date(_proExpiry);
    expiryLine = 'Expires ' + expDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } else {
    statusLine = 'ACTIVE SUBSCRIPTION';
    expiryLine = '2026 Season Pass';
  }

  var overlay = document.createElement('div');
  overlay.id = 'pro-status-modal';
  overlay.className = 'auth-modal-overlay';
  overlay.innerHTML =
    '<div class="pro-modal-box pro-status-box">' +
      '<button class="auth-modal-close" id="pro-status-close-btn">&#10005;</button>' +
      '<div class="pro-modal-crown">&#9733;</div>' +
      '<div class="pro-modal-badge-label">GRID IQ PRO</div>' +
      (name ? '<div class="pro-status-name">' + name + '</div>' : '') +
      '<div class="pro-status-line">' + statusLine + '</div>' +
      '<div class="pro-status-expiry">' + expiryLine + '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  document.getElementById('pro-status-close-btn').addEventListener('click', function() { overlay.remove(); });
}

/* ─────────────────────────────────────────────────────────
   NAV BADGE
───────────────────────────────────────────────────────── */
function updateProNavBadge() {
  var loggedIn = !!window._gridiqAuthUser;
  var isPro    = isGridIQPro();
  var onTrial  = isOnTrial();

  var badge = document.getElementById('pro-nav-btn');
  if (badge) {
    if (!loggedIn) {
      badge.className = 'pro-nav-badge hidden';
    } else if (isPro) {
      badge.className = 'pro-nav-badge pro-nav-badge--active';
      badge.innerHTML = '&#9733; PRO';
    } else if (onTrial) {
      badge.className = 'pro-nav-badge pro-nav-badge--trial';
      badge.innerHTML = '&#9733; TRIAL &bull; ' + getTrialTimeLeft() + ' LEFT';
    } else {
      badge.className = 'pro-nav-badge';
      badge.innerHTML = '&#9733; GO PRO';
    }
  }

  var bnavBtn = document.getElementById('bnav-pro-btn');
  if (bnavBtn) {
    if (!loggedIn) {
      bnavBtn.className = 'bnav-pro-btn hidden';
    } else if (isPro) {
      bnavBtn.className = 'bnav-pro-btn bnav-pro-btn--active';
      bnavBtn.querySelector('.bnav-lbl').textContent = 'PRO ★';
    } else if (onTrial) {
      bnavBtn.className = 'bnav-pro-btn';
      bnavBtn.querySelector('.bnav-lbl').textContent = getTrialTimeLeft();
    } else {
      bnavBtn.className = 'bnav-pro-btn';
      bnavBtn.querySelector('.bnav-lbl').textContent = 'GO PRO';
    }
  }

  if (typeof window.updateFantasyProBadge === 'function') window.updateFantasyProBadge();
}

/* ─────────────────────────────────────────────────────────
   TOASTS
───────────────────────────────────────────────────────── */
function showProSuccessToast(msg) {
  var toast = document.createElement('div');
  toast.className = 'pro-toast';
  toast.textContent = msg || '★ GRID IQ PRO unlocked! Welcome to the full grid.';
  document.body.appendChild(toast);
  setTimeout(function() { toast.classList.add('pro-toast--visible'); }, 50);
  setTimeout(function() {
    toast.classList.remove('pro-toast--visible');
    setTimeout(function() { toast.remove(); }, 400);
  }, 4500);
}

/* ─────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  updateProNavBadge();
  if (window._proJustUnlocked) showProSuccessToast();

  var proNavBtn = document.getElementById('pro-nav-btn');
  if (proNavBtn) proNavBtn.addEventListener('click', function() {
    if (isGridIQPro()) { openProStatusModal(); return; }
    openProModal();
  });

  var bnavProBtn = document.getElementById('bnav-pro-btn');
  if (bnavProBtn) bnavProBtn.addEventListener('click', function() {
    if (isGridIQPro()) { openProStatusModal(); return; }
    openProModal();
  });

  var proModalOverlay = document.getElementById('pro-modal');
  if (proModalOverlay) {
    proModalOverlay.addEventListener('click', function(e) {
      if (e.target === this) closeProModal();
    });
    var proCloseBtn = proModalOverlay.querySelector('.auth-modal-close');
    if (proCloseBtn) proCloseBtn.addEventListener('click', closeProModal);
  }

  var igFollowBtn = document.getElementById('pro-ig-follow-btn');
  if (igFollowBtn) igFollowBtn.addEventListener('click', function() {
    var trialStartBtn = document.getElementById('pro-trial-start-btn');
    if (trialStartBtn) trialStartBtn.disabled = false;
  });

  var trialBtn = document.getElementById('pro-trial-start-btn');
  if (trialBtn) trialBtn.addEventListener('click', startTrial);

  var skipBtn = document.querySelector('.pro-skip-btn');
  if (skipBtn) skipBtn.addEventListener('click', closeProModal);

  // Live countdown ticker — runs every second while trial is active
  if (isOnTrial()) {
    var _trialTicker = setInterval(function() {
      if (!isOnTrial()) {
        clearInterval(_trialTicker);
        updateProNavBadge();
        if (typeof STATE !== 'undefined' &&
            (STATE.activeTab === 'fantasy' || STATE.activeTab === 'compare')) {
          if (typeof switchTab === 'function') switchTab('home');
        }
        showProSuccessToast('Your free trial has ended — upgrade to keep full access.');
        return;
      }
      updateProNavBadge();
    }, 1000);
    window.addEventListener('beforeunload', function() { clearInterval(_trialTicker); });
  }
});

/* ─────────────────────────────────────────────────────────
   GLOBALS
───────────────────────────────────────────────────────── */
window.openProStatusModal   = openProStatusModal;
window.isGridIQPro          = isGridIQPro;
window.isOnTrial            = isOnTrial;
window.trialAvailable       = trialAvailable;
window.getTrialDaysLeft     = getTrialDaysLeft;
window.startTrial           = startTrial;
window.openProModal         = openProModal;
window.closeProModal        = closeProModal;
window.updateProNavBadge    = updateProNavBadge;
window.grantOwnerProIfMatch = grantOwnerProIfMatch;
