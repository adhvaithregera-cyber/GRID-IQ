/* ============================================================
   GridIQ — Falling Pattern Background  |  falling-pattern.js
   Vanilla JS port of FallingPattern React component.
   Active ONLY in light mode, inside #etheral-wrapper.

   The entire animation is CSS @keyframes — this file only
   inserts/removes the two required divs. No RAF loop.
   ============================================================ */

function initFallingPattern() {
  const wrapper = document.getElementById('etheral-wrapper');
  if (!wrapper || wrapper.querySelector('.fp-layer')) return;

  /* ── Animated streaks layer (CSS @keyframes handles motion) */
  const layer = document.createElement('div');
  layer.className = 'fp-layer';

  /* ── Frosted dot-grid overlay (backdrop-filter blur) */
  const overlay = document.createElement('div');
  overlay.className = 'fp-overlay';

  wrapper.appendChild(layer);
  wrapper.appendChild(overlay);
}

function destroyFallingPattern() {
  const wrapper = document.getElementById('etheral-wrapper');
  if (wrapper) wrapper.innerHTML = '';
}
