/* ============================================================
   GridIQ — PRO Subscription  |  pro.js

   ── CONFIG ──────────────────────────────────────────────────
   PAYMENT_LINK_* — paste your Razorpay / Gumroad link here
   LAUNCH_DATE    — set to launch date to activate promo codes
   ── ─────────────────────────────────────────────────────── */

/* ── Owner config (SHA-256 of owner email — never store plaintext) ── */
var OWNER_EMAIL_HASH = '3f3f6c85347fa6ca01e2601e1ba6bbe4bbb33652e39f12bd460073bdb0d7d136';

/* ── PRO features list (shown in upgrade modal) ─────────── */
var PRO_FEATURES = [
  { label: 'Fantasy Team Builder',   desc: '5 drivers + 2 constructors, budget cap & PPM rankings', live: true  },
  { label: 'H2H Driver Comparison',  desc: 'Radar chart comparing any two drivers across 5 axes',   live: true  },
  { label: 'Driver Form Index',      desc: 'Hot/cold streak indicator based on recent race results', live: false },
  { label: 'More features this season', desc: 'New PRO tools added throughout the 2026 F1 season',  live: false },
];

/* ── Beta & trial config ────────────────────────────────── */
var BETA_END_DATE = '2026-11-30';
var TRIAL_DAYS    = 3;

/* ── Launch config ──────────────────────────────────────── */
var LAUNCH_DATE     = null;

/* ── Payment link config ────────────────────────────────── */
var PAYMENT_LINK_GLOBAL = 'PASTE_PAYMENT_LINK_HERE';
var PAYMENT_LINK_INDIA  = 'PASTE_PAYMENT_LINK_HERE';

/* ─────────────────────────────────────────────────────────
   PRO STATUS
───────────────────────────────────────────────────────── */
function isGridIQPro() {
  return true; // TEMP: all features free for public feedback — revert this line to re-enable PRO gating
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return true;
  // owner/paid flags are only trustworthy when the user is signed in
  // (auth.js strips them on sign-out and syncs them from Firestore on sign-in)
  var signedIn = typeof firebase !== 'undefined'
    ? false // legacy guard — unused
    : !!(window._gridiqAuthUser);
  // window._gridiqAuthUser is set by auth.js when Firebase confirms the session
  if (window._gridiqAuthUser) {
    if (localStorage.getItem('gridiq_owner') === 'true') return true;
    if (localStorage.getItem('gridiq_pro') === 'true') return true;
  }
  return _isOnActiveTrial();
}

/* Trial is only active if the user explicitly started it */
function _isOnActiveTrial() {
  if (new Date() > new Date(BETA_END_DATE)) return false;
  var ts = localStorage.getItem('gridiq_trial_start');
  if (!ts) return false;
  return (Date.now() - parseInt(ts, 10)) < TRIAL_DAYS * 86400000;
}

function isOnTrial() {
  if (localStorage.getItem('gridiq_pro') === 'true') return false;
  return _isOnActiveTrial();
}

function getTrialDaysLeft() {
  var ts = localStorage.getItem('gridiq_trial_start');
  if (!ts) return TRIAL_DAYS;
  var left = Math.ceil((TRIAL_DAYS * 86400000 - (Date.now() - parseInt(ts, 10))) / 86400000);
  return Math.max(0, left);
}

function getTrialTimeLeft() {
  var ts = localStorage.getItem('gridiq_trial_start');
  if (!ts) return '';
  var msLeft = TRIAL_DAYS * 86400000 - (Date.now() - parseInt(ts, 10));
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

/* True if the user can still opt into a trial */
function trialAvailable() {
  if (!window._gridiqAuthUser) return false;
  if (localStorage.getItem('gridiq_pro') === 'true') return false;
  if (new Date() > new Date(BETA_END_DATE)) return false;
  return !localStorage.getItem('gridiq_trial_start');
}

/* Called when user clicks "Start free trial" in the modal */
function startTrial() {
  if (!window._gridiqAuthUser) { openAuthModal(); return; }
  if (localStorage.getItem('gridiq_trial_start')) return;
  localStorage.setItem('gridiq_trial_start', Date.now().toString());
  updateProNavBadge();
  closeProModal();
  showProSuccessToast('★ ' + TRIAL_DAYS + '-day free trial started — full PRO access unlocked!');
}

/* ── Owner auto-grant (called from auth.js on sign-in) ──── */
/* Returns true if the signed-in email is an owner, so auth.js
   can also write the status to Firestore. */
async function grantOwnerProIfMatch(email) {
  if (!email) return false;
  try {
    var msgBuf  = new TextEncoder().encode(email.trim().toLowerCase());
    var hashBuf = await crypto.subtle.digest('SHA-256', msgBuf);
    var hashHex = Array.from(new Uint8Array(hashBuf))
      .map(function(b) { return b.toString(16).padStart(2, '0'); })
      .join('');
    if (hashHex === OWNER_EMAIL_HASH) {
      localStorage.setItem('gridiq_pro', 'true');
      localStorage.setItem('gridiq_owner', 'true');
      localStorage.removeItem('gridiq_trial_start');
      updateProNavBadge();
      return true;
    }
  } catch (_) {}
  return false;
}


/* ─────────────────────────────────────────────────────────
   PAYMENT LINKS
───────────────────────────────────────────────────────── */
function _isIndia() {
  var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return tz.indexOf('Calcutta') !== -1 || tz.indexOf('Kolkata') !== -1;
}

function getProPrice() {
  return _isIndia() ? '₹199 / month' : '$1.99 / month';
}

function getPaymentLink() {
  var base = _isIndia() ? PAYMENT_LINK_INDIA : PAYMENT_LINK_GLOBAL;
  if (base.indexOf('PASTE_') === 0) return null;
  var successUrl = encodeURIComponent(location.origin + location.pathname + '?pro=1');
  return base + (base.indexOf('?') === -1 ? '?' : '&') + 'success_url=' + successUrl;
}

function handleUpgradeClick() {
  var link = getPaymentLink();
  if (!link) {
    var el = document.getElementById('pro-payment-note');
    if (el) { el.textContent = 'Payment coming soon — check back shortly!'; el.classList.remove('hidden'); }
    return;
  }
  window.open(link, '_blank');
}

/* ── Detect payment success redirect (?pro=1) ───────────── */
/* NOTE: We do NOT set localStorage here. PRO status is authoritative
   in Firestore. After a real payment, the provider's webhook writes
   isPro:true to Firestore, and _syncProFromFirestore (auth.js) grants
   the flag on the next sign-in. Setting it client-side from a URL
   param would allow any user to self-grant PRO by visiting ?pro=1. */
(function detectProRedirect() {
  if (new URLSearchParams(location.search).get('pro') === '1') {
    history.replaceState({}, '', location.pathname);
    window._proJustUnlocked = true;
  }
})();

/* ─────────────────────────────────────────────────────────
   PRO MODAL
───────────────────────────────────────────────────────── */
function openProModal() {
  if (!window._gridiqAuthUser) { openAuthModal(); return; }

  var modal = document.getElementById('pro-modal');
  if (!modal) return;

  // Dismiss welcome modal so they don't stack
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

  // Locale price
  var priceEl = document.getElementById('pro-price-display');
  if (priceEl) priceEl.textContent = getProPrice();

  // Trial section — shown only when trial is still available; reset button lock
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
   NAV BADGE
───────────────────────────────────────────────────────── */
function updateProNavBadge() {
  var badge = document.getElementById('pro-nav-btn');
  if (badge) {
    if (localStorage.getItem('gridiq_pro') === 'true' ||
        location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      badge.className = 'pro-nav-badge pro-nav-badge--active';
      badge.innerHTML = '&#9733; PRO';
      badge.onclick = null;
      badge.style.cursor = 'default';
    } else if (isOnTrial()) {
      badge.className = 'pro-nav-badge pro-nav-badge--trial';
      badge.innerHTML = '&#9733; TRIAL &bull; ' + getTrialTimeLeft() + ' LEFT';
      badge.onclick = openProModal;
      badge.style.cursor = 'pointer';
    }
  }

  var bnavBtn = document.getElementById('bnav-pro-btn');
  if (bnavBtn) {
    if (localStorage.getItem('gridiq_pro') === 'true' ||
        location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      bnavBtn.classList.add('bnav-pro-btn--active');
      bnavBtn.querySelector('.bnav-lbl').textContent = 'PRO ★';
      bnavBtn.style.cursor = 'default';
      bnavBtn.style.pointerEvents = 'none';
    } else if (isOnTrial()) {
      bnavBtn.querySelector('.bnav-lbl').textContent = getTrialTimeLeft();
      bnavBtn.style.cursor = 'pointer';
      bnavBtn.style.pointerEvents = '';
    }
  }
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
  if (window._proJustUnlocked) {
    showProSuccessToast();
  }

  /* ── Pro modal event listeners (replaces inline onclick= attrs) ── */
  var proNavBtn = document.getElementById('pro-nav-btn');
  if (proNavBtn) proNavBtn.addEventListener('click', function() {
    if (isGridIQPro()) return;
    openProModal();
  });

  var bnavProBtn = document.getElementById('bnav-pro-btn');
  if (bnavProBtn) bnavProBtn.addEventListener('click', function() {
    if (isGridIQPro()) return;
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

  var upgradeBtn = document.querySelector('.pro-upgrade-btn');
  if (upgradeBtn) upgradeBtn.addEventListener('click', handleUpgradeClick);

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
        // If user is on a PRO-only tab, bounce them back to home
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
window.isGridIQPro          = isGridIQPro;
window.isOnTrial            = isOnTrial;
window.trialAvailable       = trialAvailable;
window.getTrialDaysLeft     = getTrialDaysLeft;
window.startTrial           = startTrial;
window.openProModal         = openProModal;
window.closeProModal        = closeProModal;
window.handleUpgradeClick   = handleUpgradeClick;
window.grantOwnerProIfMatch = grantOwnerProIfMatch;
window.getPaymentLink       = getPaymentLink;
