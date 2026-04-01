/* ============================================================
   GridIQ — PRO Subscription  |  pro.js
   Handles PRO status, upgrade modal, welcome popup, and
   Razorpay/Gumroad payment link redirect detection.

   ── SETUP (after getting your payment link) ─────────────────
   1. Get a payment link from Razorpay or Gumroad
   2. Set the success/redirect URL to:
      https://adhvaithregera-cyber.github.io/GRID-IQ/?pro=1
   3. Paste your link URL into PAYMENT_LINK_GLOBAL below
      (and PAYMENT_LINK_INDIA if using separate India pricing)
   ── ─────────────────────────────────────────────────────── */

/* ── Payment link config ────────────────────────────────── */
var PAYMENT_LINK_GLOBAL = 'PASTE_PAYMENT_LINK_HERE';  // $1.99/mo (Razorpay or Gumroad)
var PAYMENT_LINK_INDIA  = 'PASTE_PAYMENT_LINK_HERE';  // ₹199/mo  (can be same as above if using Gumroad)

/* ── PRO status ─────────────────────────────────────────── */
function isGridIQPro() {
  return localStorage.getItem('gridiq_pro') === 'true';
}

/* ── Detect payment success redirect (?pro=1) ───────────── */
(function detectProRedirect() {
  var params = new URLSearchParams(location.search);
  if (params.get('pro') === '1') {
    localStorage.setItem('gridiq_pro', 'true');
    history.replaceState({}, '', location.pathname);
    // Flag so we show the success toast after DOM is ready
    window._proJustUnlocked = true;
  }
})();

/* ── Locale helpers ─────────────────────────────────────── */
function _isIndia() {
  var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return tz.indexOf('Calcutta') !== -1 || tz.indexOf('Kolkata') !== -1;
}

function getProPrice() {
  return _isIndia() ? '₹199 / month' : '$1.99 / month';
}

function getPaymentLink() {
  var base = _isIndia() ? PAYMENT_LINK_INDIA : PAYMENT_LINK_GLOBAL;
  if (base.indexOf('PASTE_') === 0) return null; // not configured yet
  // Append success redirect for Razorpay-style links
  var successUrl = encodeURIComponent(location.origin + location.pathname + '?pro=1');
  return base + (base.indexOf('?') === -1 ? '?' : '&') + 'success_url=' + successUrl;
}

/* ── PRO modal ──────────────────────────────────────────── */
function openProModal() {
  var modal = document.getElementById('pro-modal');
  if (!modal) return;
  // Set locale-aware price
  var priceEl = document.getElementById('pro-price-display');
  if (priceEl) priceEl.textContent = getProPrice();
  modal.classList.remove('hidden');
}

function closeProModal() {
  var modal = document.getElementById('pro-modal');
  if (modal) modal.classList.add('hidden');
}

function handleUpgradeClick() {
  var link = getPaymentLink();
  if (!link) {
    // Payment not configured yet — show coming soon message
    var el = document.getElementById('pro-payment-note');
    if (el) {
      el.textContent = 'Payment coming soon — check back shortly!';
      el.classList.remove('hidden');
    }
    return;
  }
  window.open(link, '_blank');
}

/* ── Nav PRO badge state ────────────────────────────────── */
function updateProNavBadge() {
  var badge = document.getElementById('pro-nav-btn');
  if (!badge) return;
  if (isGridIQPro()) {
    badge.classList.add('pro-nav-badge--active');
    badge.innerHTML = '&#9733; PRO';
    badge.onclick = null;
    badge.style.cursor = 'default';
  }
}

/* ── Success toast (shown after payment redirect) ───────── */
function showProSuccessToast() {
  var toast = document.createElement('div');
  toast.className = 'pro-toast';
  toast.textContent = '★ GRID IQ PRO unlocked! Welcome to the full grid.';
  document.body.appendChild(toast);
  setTimeout(function() { toast.classList.add('pro-toast--visible'); }, 50);
  setTimeout(function() {
    toast.classList.remove('pro-toast--visible');
    setTimeout(function() { toast.remove(); }, 400);
  }, 4000);
}

/* ── Welcome popup (once per session if not PRO) ─────────── */
function maybeShowProPopup() {
  if (isGridIQPro()) return;
  if (sessionStorage.getItem('gridiq_promo_shown')) return;
  sessionStorage.setItem('gridiq_promo_shown', '1');
  setTimeout(openProModal, 1800);
}

/* ── Init (run after DOM ready) ─────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  updateProNavBadge();
  if (window._proJustUnlocked) {
    showProSuccessToast();
  } else {
    maybeShowProPopup();
  }
});

/* ── Expose globals ─────────────────────────────────────── */
window.isGridIQPro      = isGridIQPro;
window.openProModal     = openProModal;
window.closeProModal    = closeProModal;
window.handleUpgradeClick = handleUpgradeClick;
window.getPaymentLink   = getPaymentLink;
