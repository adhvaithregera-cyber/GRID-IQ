/* ============================================================
   GridIQ — PRO Subscription  |  pro.js

   ── CONFIG ──────────────────────────────────────────────────
   UPI_ID       — your UPI address (e.g. yourname@upi)
   CONTACT_EMAIL — email users send payment proof to
   ── ─────────────────────────────────────────────────────── */

/* ── Owner config (SHA-256 of owner email — never store plaintext) ── */
var OWNER_EMAIL_HASH = '3f3f6c85347fa6ca01e2601e1ba6bbe4bbb33652e39f12bd460073bdb0d7d136';

/* ── UPI payment config ─────────────────────────────────── */
var UPI_ID        = 'adhvaith.regera@oksbi';
var UPI_NAME      = 'GridIQ';
var UPI_AMOUNT    = '199';
var CONTACT_EMAIL = 'gridiq.app@gmail.com';

/* ── PRO features list (shown in upgrade modal) ─────────── */
var PRO_FEATURES = [
  { label: 'Fantasy Team Builder',      desc: '5 drivers + 2 constructors, budget cap & PPM rankings', live: true  },
  { label: 'H2H Driver Comparison',     desc: 'Radar chart comparing any two drivers across 5 axes',   live: true  },
  { label: 'Driver Form Index',         desc: 'Hot/cold streak indicator based on recent race results', live: false },
  { label: 'More features this season', desc: 'New PRO tools added throughout the 2026 season',        live: false },
];

/* ── Beta & trial config ────────────────────────────────── */
var BETA_END_DATE = '2026-11-30';
var TRIAL_DAYS    = 3;

/* ── PRO status — set ONLY by Firestore sync in auth.js ── */
var _proVerified   = false;
var _ownerVerified = false;

function _setProVerified(isPro, isOwner) {
  _proVerified   = isPro   === true;
  _ownerVerified = isOwner === true;
}
window._setGridIQProVerified = _setProVerified;

/* ─────────────────────────────────────────────────────────
   UPI
───────────────────────────────────────────────────────── */
function _getUpiQrUrl() {
  var upiString = 'upi://pay?pa=' + encodeURIComponent(UPI_ID) +
    '&pn=' + encodeURIComponent(UPI_NAME) +
    '&am=' + UPI_AMOUNT +
    '&cu=INR' +
    '&tn=' + encodeURIComponent('GridIQ Pro Subscription');
  return 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(upiString);
}

function _getContactMailto() {
  var subject = encodeURIComponent('GridIQ Pro Payment');
  var body = encodeURIComponent('UPI Transaction ID / UTR:\nAccount email I signed in with:\n');
  return 'mailto:' + CONTACT_EMAIL + '?subject=' + subject + '&body=' + body;
}

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
  var ts = localStorage.getItem('gridiq_trial_start');
  if (!ts) return false;
  return (Date.now() - parseInt(ts, 10)) < TRIAL_DAYS * 86400000;
}

function isOnTrial() {
  if (_proVerified || _ownerVerified) return false;
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

function trialAvailable() {
  if (!window._gridiqAuthUser) return false;
  if (_proVerified || _ownerVerified) return false;
  if (new Date() > new Date(BETA_END_DATE)) return false;
  return !localStorage.getItem('gridiq_trial_start');
}

function startTrial() {
  if (!window._gridiqAuthUser) { openAuthModal(); return; }
  if (localStorage.getItem('gridiq_trial_start')) return;
  localStorage.setItem('gridiq_trial_start', Date.now().toString());
  updateProNavBadge();
  closeProModal();
  showProSuccessToast('★ ' + TRIAL_DAYS + '-day free trial started — full PRO access unlocked!');
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

  // UPI QR code
  var qrImg = document.getElementById('upi-qr-img');
  if (qrImg && UPI_ID.indexOf('PASTE_') !== 0) qrImg.src = _getUpiQrUrl();

  // UPI ID display
  var upiDisplay = document.getElementById('upi-id-display');
  if (upiDisplay) upiDisplay.textContent = UPI_ID.indexOf('PASTE_') === 0 ? 'Coming soon' : UPI_ID;

  // Contact email link
  var contactLink = document.getElementById('upi-contact-link');
  if (contactLink) {
    if (CONTACT_EMAIL.indexOf('PASTE_') === 0) {
      contactLink.classList.add('hidden');
    } else {
      contactLink.href = _getContactMailto();
      contactLink.classList.remove('hidden');
    }
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
   NAV BADGE
───────────────────────────────────────────────────────── */
function updateProNavBadge() {
  var loggedIn = !!window._gridiqAuthUser;
  var isPro    = isGridIQPro();
  var onTrial  = isOnTrial();

  var badge = document.getElementById('pro-nav-btn');
  if (badge) {
    if (!loggedIn || isPro) {
      badge.className = 'pro-nav-badge hidden';
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
    if (!loggedIn || isPro) {
      bnavBtn.className = 'bnav-pro-btn hidden';
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

  // UPI copy button
  var copyBtn = document.getElementById('upi-copy-btn');
  if (copyBtn) copyBtn.addEventListener('click', function() {
    if (UPI_ID.indexOf('PASTE_') === 0) return;
    navigator.clipboard.writeText(UPI_ID).then(function() {
      copyBtn.textContent = 'COPIED!';
      setTimeout(function() { copyBtn.textContent = 'COPY'; }, 2000);
    });
  });

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
window.isGridIQPro          = isGridIQPro;
window.isOnTrial            = isOnTrial;
window.trialAvailable       = trialAvailable;
window.getTrialDaysLeft     = getTrialDaysLeft;
window.startTrial           = startTrial;
window.openProModal         = openProModal;
window.closeProModal        = closeProModal;
window.updateProNavBadge    = updateProNavBadge;
window.grantOwnerProIfMatch = grantOwnerProIfMatch;
