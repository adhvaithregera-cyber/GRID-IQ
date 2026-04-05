/* ============================================================
   GridIQ — Google Play Billing  |  billing.js
   Uses cordova-plugin-purchase (CdvPurchase) v13+
   Only active inside the Capacitor Android app.
   Web purchases still go through the external payment link in pro.js.
   ============================================================ */

/* ── Product config ─────────────────────────────────────── */
var PLAY_PRODUCT_ID = 'gridiq_pro_monthly'; // must match Play Console exact ID

/* ── Internal state ─────────────────────────────────────── */
var _store        = null;
var _storeReady   = false;
var _pendingOrder = false;

/* ── Platform detection ─────────────────────────────────── */
function _isAndroidApp() {
  return typeof window.Capacitor !== 'undefined' &&
         window.Capacitor.getPlatform() === 'android';
}

/* ─────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────── */
function initBilling() {
  if (!_isAndroidApp()) return;
  if (typeof window.CdvPurchase === 'undefined') {
    console.warn('[GridIQ billing] CdvPurchase not available — plugin not loaded?');
    return;
  }

  var CdvPurchase = window.CdvPurchase;
  _store = CdvPurchase.store;
  _store.verbosity = CdvPurchase.LogLevel.WARNING;

  /* Register the subscription product */
  _store.register([{
    id:       PLAY_PRODUCT_ID,
    type:     CdvPurchase.ProductType.PAID_SUBSCRIPTION,
    platform: CdvPurchase.Platform.GOOGLE_PLAY,
  }]);

  /* ── Event handlers ───────────────────────────────────── */
  _store.when()

    /* Product loaded from Play Store — update price display */
    .productUpdated(function(product) {
      if (product.id !== PLAY_PRODUCT_ID) return;
      var offer = product.offers && product.offers[0];
      if (!offer) return;
      var phase = offer.pricingPhases && offer.pricingPhases[0];
      if (!phase) return;
      var priceEl = document.getElementById('pro-price-display');
      if (priceEl) priceEl.textContent = phase.price + ' / month';
    })

    /* Purchase approved by Google Play — verify it */
    .approved(function(transaction) {
      transaction.verify();
    })

    /* Receipt verified — grant PRO and finish the transaction */
    .verified(function(receipt) {
      _grantPro(receipt);
      receipt.finish();
    })

    /* Verification failed (e.g. network error) — log and retry later */
    .unverified(function(receipt) {
      console.warn('[GridIQ billing] Receipt unverified — will retry on next launch.', receipt);
      _pendingOrder = false;
    });

  /* Initialize the Google Play platform */
  _store.initialize([CdvPurchase.Platform.GOOGLE_PLAY])
    .then(function() {
      _storeReady = true;
    })
    .catch(function(err) {
      console.error('[GridIQ billing] Store init failed:', err);
    });
}

/* ─────────────────────────────────────────────────────────
   GRANT PRO
───────────────────────────────────────────────────────── */
function _grantPro(receipt) {
  /* 1. Set localStorage flag (used by isGridIQPro() immediately) */
  localStorage.setItem('gridiq_pro', 'true');

  /* 2. Persist to Firestore so it survives reinstalls / other devices */
  if (typeof window._gridiqWriteProToFirestore === 'function' && window._gridiqAuthUser) {
    window._gridiqWriteProToFirestore(window._gridiqAuthUser.uid);
  }

  /* 3. Refresh UI */
  if (typeof updateProNavBadge === 'function') updateProNavBadge();
  if (typeof closeProModal    === 'function') closeProModal();
  if (typeof showProSuccessToast === 'function') {
    showProSuccessToast('★ GRID IQ PRO unlocked — welcome to the full grid!');
  }

  _pendingOrder = false;
}

/* ─────────────────────────────────────────────────────────
   PURCHASE
───────────────────────────────────────────────────────── */
function launchPlayStorePurchase() {
  if (!_isAndroidApp()) return false; // caller falls back to web link

  if (!_storeReady || !_store) {
    if (typeof showToast === 'function') showToast('Store loading — please try again in a moment.');
    return true; // handled on Android side, even if not ready
  }

  if (_pendingOrder) return true; // prevent double-tap

  var CdvPurchase = window.CdvPurchase;
  var product = _store.get(PLAY_PRODUCT_ID, CdvPurchase.Platform.GOOGLE_PLAY);

  if (!product || !product.offers || !product.offers[0]) {
    if (typeof showToast === 'function') showToast('Product unavailable — check your connection and try again.');
    return true;
  }

  _pendingOrder = true;
  product.offers[0].order()
    .then(function(error) {
      // order() resolves with an IError on failure, or undefined on success
      if (error) {
        _pendingOrder = false;
        if (error.code !== window.CdvPurchase.ErrorCode.PAYMENT_CANCELLED) {
          if (typeof showToast === 'function') showToast('Purchase failed: ' + (error.message || 'unknown error'));
        }
      }
    })
    .catch(function(err) {
      _pendingOrder = false;
      console.error('[GridIQ billing] order() threw:', err);
    });

  return true; // handled
}

/* ─────────────────────────────────────────────────────────
   RESTORE PURCHASES
   Call this when the user asks to restore, e.g. after reinstall.
───────────────────────────────────────────────────────── */
function restorePlayPurchases() {
  if (!_isAndroidApp() || !_store) return;
  _store.restorePurchases()
    .then(function() {
      if (typeof showToast === 'function') showToast('Purchases restored.');
    })
    .catch(function(err) {
      console.error('[GridIQ billing] Restore failed:', err);
      if (typeof showToast === 'function') showToast('Restore failed — please try again.');
    });
}

/* ─────────────────────────────────────────────────────────
   BOOT
───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', initBilling);

/* ─────────────────────────────────────────────────────────
   GLOBALS
───────────────────────────────────────────────────────── */
window.launchPlayStorePurchase = launchPlayStorePurchase;
window.restorePlayPurchases    = restorePlayPurchases;
