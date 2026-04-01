/* ============================================================
   GridIQ — PRO Subscription  |  pro.js

   ── CONFIG YOU NEED TO FILL IN ──────────────────────────────
   1. OWNER_EMAILS       — your sign-in email(s), get PRO free
   2. PAYMENT_LINK_*     — your Razorpay / Gumroad link
   3. LAUNCH_DATE        — set to today's date when you officially
                           launch (enables the promo code offer)
   ── ─────────────────────────────────────────────────────── */

/* ── Owner config ───────────────────────────────────────── */
var OWNER_EMAILS = [
  'ADD_YOUR_EMAIL_HERE'   // your sign-in email — gets PRO automatically
];

/* ── Beta & trial config ────────────────────────────────── */
var BETA_END_DATE = '2026-11-30';   // end of 2026 F1 season — beta trial offered until this date
var TRIAL_DAYS    = 7;

/* ── Launch & promo config ──────────────────────────────── */
// Set LAUNCH_DATE to today's date when you officially go live (e.g. '2026-06-01').
// This activates the "follow us = 1 month free" promo code for 3 months.
var LAUNCH_DATE = null;   // e.g. '2026-06-01'

// Social handle for the promo instructions
var SOCIAL_HANDLE = '@gridiq';       // update with your actual handle
var SOCIAL_PLATFORM = 'Instagram';   // or 'X' / 'Twitter'

/* ── Payment link config ────────────────────────────────── */
var PAYMENT_LINK_GLOBAL = 'PASTE_PAYMENT_LINK_HERE';  // $1.99/mo
var PAYMENT_LINK_INDIA  = 'PASTE_PAYMENT_LINK_HERE';  // ₹199/mo (can be same if using Gumroad)

/* ─────────────────────────────────────────────────────────
   PRO STATUS
───────────────────────────────────────────────────────── */
function isGridIQPro() {
  // Always PRO on localhost (dev environment)
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return true;
  if (localStorage.getItem('gridiq_pro') === 'true') return true;
  return _isOnActiveTrial();
}

function _isOnActiveTrial() {
  if (new Date() > new Date(BETA_END_DATE)) return false;
  var ts = localStorage.getItem('gridiq_trial_start');
  if (!ts) {
    localStorage.setItem('gridiq_trial_start', Date.now().toString());
    return true;
  }
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

/* ── Owner auto-grant (called from auth.js on sign-in) ──── */
function grantOwnerProIfMatch(email) {
  if (!email) return;
  if (OWNER_EMAILS.indexOf(email) !== -1) {
    localStorage.setItem('gridiq_pro', 'true');
    updateProNavBadge();
  }
}

/* ─────────────────────────────────────────────────────────
   PROMO CODES  (activated 3 months after LAUNCH_DATE)
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
  msgEl.classList.toggle('pro-promo-msg--err', true);
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
/* ── Owner secret setup (?ownersetup=GRIDIQ2026) ─────────── */
(function detectRedirects() {
  var params = new URLSearchParams(location.search);
  if (params.get('pro') === '1') {
    localStorage.setItem('gridiq_pro', 'true');
    history.replaceState({}, '', location.pathname);
    window._proJustUnlocked = true;
  }
  if (params.get('ownersetup') === 'GRIDIQ2026') {
    localStorage.setItem('gridiq_pro', 'true');
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

  // Update locale price
  var priceEl = document.getElementById('pro-price-display');
  if (priceEl) priceEl.textContent = getProPrice();

  // Trial badge — show only if beta is still active and user hasn't started trial yet
  var trialBadge = document.getElementById('pro-trial-badge');
  var betaActive = new Date() <= new Date(BETA_END_DATE);
  var trialStarted = !!localStorage.getItem('gridiq_trial_start');
  if (trialBadge) {
    trialBadge.classList.toggle('hidden', !betaActive || trialStarted);
  }

  // Promo section — show only if LAUNCH_DATE is set and offer is active
  var promoSection = document.getElementById('pro-promo-section');
  var codes = _getPromoCodes();
  var promoActive = LAUNCH_DATE && Object.keys(codes).length > 0 &&
                    new Date() <= new Date(Object.values(codes)[0].expires);
  if (promoSection) promoSection.classList.toggle('hidden', !promoActive);

  // Update promo instructions
  var promoInstr = document.getElementById('pro-promo-instr');
  if (promoInstr && promoActive) {
    promoInstr.textContent = 'Follow ' + SOCIAL_HANDLE + ' on ' + SOCIAL_PLATFORM +
      ' and DM us your username — we\'ll send you a code for 1 month free.';
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
  if (localStorage.getItem('gridiq_pro') === 'true') {
    badge.className = 'pro-nav-badge pro-nav-badge--active';
    badge.innerHTML = '&#9733; PRO';
    badge.onclick = null;
    badge.style.cursor = 'default';
  } else if (isOnTrial()) {
    var days = getTrialDaysLeft();
    badge.className = 'pro-nav-badge pro-nav-badge--trial';
    badge.innerHTML = '&#9733; TRIAL &bull; ' + days + 'D LEFT';
    badge.onclick = openProModal;
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

function _showTrialWelcomeToast() {
  var days = getTrialDaysLeft();
  showProSuccessToast('★ ' + days + '-day free trial active — full PRO access unlocked!');
}

/* ─────────────────────────────────────────────────────────
   WELCOME POPUP LOGIC
───────────────────────────────────────────────────────── */
function maybeShowProPopup() {
  if (isGridIQPro()) {
    // If this is their very first session on trial, show welcome toast
    if (isOnTrial() && !sessionStorage.getItem('gridiq_trial_welcome')) {
      sessionStorage.setItem('gridiq_trial_welcome', '1');
      setTimeout(_showTrialWelcomeToast, 1200);
    }
    return;
  }
  // Expired/non-trial users: show upgrade popup once per session
  if (sessionStorage.getItem('gridiq_promo_shown')) return;
  sessionStorage.setItem('gridiq_promo_shown', '1');
  setTimeout(openProModal, 1800);
}

/* ─────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  updateProNavBadge();
  if (window._proJustUnlocked) {
    showProSuccessToast();
  } else {
    maybeShowProPopup();
  }
});

/* ─────────────────────────────────────────────────────────
   GLOBALS
───────────────────────────────────────────────────────── */
window.isGridIQPro        = isGridIQPro;
window.isOnTrial          = isOnTrial;
window.getTrialDaysLeft   = getTrialDaysLeft;
window.openProModal       = openProModal;
window.closeProModal      = closeProModal;
window.handleUpgradeClick = handleUpgradeClick;
window.handlePromoSubmit  = handlePromoSubmit;
window.grantOwnerProIfMatch = grantOwnerProIfMatch;
window.redeemPromoCode    = redeemPromoCode;
window.getPaymentLink     = getPaymentLink;
