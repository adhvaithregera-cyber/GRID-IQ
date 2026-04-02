/* ============================================================
   GridIQ — PRO Subscription  |  pro.js

   ── CONFIG ──────────────────────────────────────────────────
   PAYMENT_LINK_* — paste your Razorpay / Gumroad link here
   LAUNCH_DATE    — set to launch date to activate promo codes
   ── ─────────────────────────────────────────────────────── */

/* ── Owner config ───────────────────────────────────────── */
var OWNER_EMAILS = [
  'adhvaith.regera@gmail.com'
];

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

/* ── Launch & promo config ──────────────────────────────── */
var LAUNCH_DATE     = null;
var SOCIAL_HANDLE   = '@gridiq';
var SOCIAL_PLATFORM = 'Instagram';

/* ── Payment link config ────────────────────────────────── */
var PAYMENT_LINK_GLOBAL = 'PASTE_PAYMENT_LINK_HERE';
var PAYMENT_LINK_INDIA  = 'PASTE_PAYMENT_LINK_HERE';

/* ─────────────────────────────────────────────────────────
   PRO STATUS
───────────────────────────────────────────────────────── */
function isGridIQPro() {
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

/* True if the user can still opt into a trial */
function trialAvailable() {
  if (localStorage.getItem('gridiq_pro') === 'true') return false;
  if (new Date() > new Date(BETA_END_DATE)) return false;
  return !localStorage.getItem('gridiq_trial_start');
}

/* Called when user clicks "Start free trial" in the modal */
function startTrial() {
  if (localStorage.getItem('gridiq_trial_start')) return;
  localStorage.setItem('gridiq_trial_start', Date.now().toString());
  updateProNavBadge();
  closeProModal();
  showProSuccessToast('★ ' + TRIAL_DAYS + '-day free trial started — full PRO access unlocked!');
}

/* ── Owner auto-grant (called from auth.js on sign-in) ──── */
/* Returns true if the signed-in email is an owner, so auth.js
   can also write the status to Firestore. */
function grantOwnerProIfMatch(email) {
  if (!email) return false;
  if (OWNER_EMAILS.indexOf(email) !== -1) {
    localStorage.setItem('gridiq_pro', 'true');
    localStorage.setItem('gridiq_owner', 'true');
    localStorage.removeItem('gridiq_trial_start');
    updateProNavBadge();
    return true;
  }
  return false;
}

/* ─────────────────────────────────────────────────────────
   PROMO CODES
───────────────────────────────────────────────────────── */
function _getPromoCodes() {
  if (!LAUNCH_DATE) return {};
  var exp = new Date(LAUNCH_DATE);
  exp.setMonth(exp.getMonth() + 3);
  var expStr = exp.toISOString().split('T')[0];
  return { 'FOLLOW2026': { expires: expStr } };
}

function redeemPromoCode(code) {
  var upper = (code || '').trim().toUpperCase();
  if (!upper) return 'Please enter a code.';
  var codes = _getPromoCodes();
  var promo = codes[upper];
  if (!promo)                               return 'Invalid promo code.';
  if (new Date() > new Date(promo.expires)) return 'This code has expired.';
  if (localStorage.getItem('gridiq_promo_used') === upper) return 'You have already used this code.';
  localStorage.setItem('gridiq_pro', 'true');
  localStorage.setItem('gridiq_promo_used', upper);
  updateProNavBadge();
  closeProModal();
  showProSuccessToast('★ 1 month of GRID IQ PRO unlocked!');
  return 'success';
}

function handlePromoSubmit() {
  var input = document.getElementById('pro-promo-input');
  var msgEl = document.getElementById('pro-promo-msg');
  if (!input || !msgEl) return;
  var result = redeemPromoCode(input.value);
  if (result === 'success') return;
  msgEl.textContent = result;
  msgEl.classList.remove('hidden');
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

  // Trial button — only show if user can still opt in
  var trialSection = document.getElementById('pro-trial-section');
  if (trialSection) trialSection.classList.toggle('hidden', !trialAvailable());

  // Promo code section — only show after launch + within 3 months
  var promoSection = document.getElementById('pro-promo-section');
  var codes = _getPromoCodes();
  var promoActive = LAUNCH_DATE && Object.keys(codes).length > 0 &&
                    new Date() <= new Date(Object.values(codes)[0].expires);
  if (promoSection) promoSection.classList.toggle('hidden', !promoActive);

  if (promoActive) {
    var promoInstr = document.getElementById('pro-promo-instr');
    if (promoInstr) {
      promoInstr.textContent = 'Follow ' + SOCIAL_HANDLE + ' on ' + SOCIAL_PLATFORM +
        ' and DM us your username — we\'ll send you a code for 1 month free.';
    }
  }

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
  if (!badge) return;
  if (localStorage.getItem('gridiq_pro') === 'true' ||
      location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    badge.className = 'pro-nav-badge pro-nav-badge--active';
    badge.innerHTML = '&#9733; PRO';
    badge.onclick = null;
    badge.style.cursor = 'default';
  } else if (isOnTrial()) {
    var days = getTrialDaysLeft();
    badge.className = 'pro-nav-badge pro-nav-badge--trial';
    badge.innerHTML = '&#9733; TRIAL &bull; ' + days + 'D LEFT';
    badge.onclick = openProModal;
    badge.style.cursor = 'pointer';
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
  if (proNavBtn) proNavBtn.addEventListener('click', openProModal);

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

  var trialBtn = document.querySelector('.pro-trial-btn');
  if (trialBtn) trialBtn.addEventListener('click', startTrial);

  var promoSubmit = document.querySelector('.pro-promo-submit');
  if (promoSubmit) promoSubmit.addEventListener('click', handlePromoSubmit);

  var skipBtn = document.querySelector('.pro-skip-btn');
  if (skipBtn) skipBtn.addEventListener('click', closeProModal);
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
window.handlePromoSubmit    = handlePromoSubmit;
window.grantOwnerProIfMatch = grantOwnerProIfMatch;
window.redeemPromoCode      = redeemPromoCode;
window.getPaymentLink       = getPaymentLink;
