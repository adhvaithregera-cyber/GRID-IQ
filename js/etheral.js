/* ============================================================
   GridIQ — Etheral Shadow Background  |  etheral.js
   Vanilla JS port of the Etheral Shadow React component.
   Active ONLY in light mode, replaces the smoke canvas visually.
   ============================================================ */

const ETHERAL_MASK_URL  = 'https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png';
const ETHERAL_NOISE_URL = 'https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png';
const ETHERAL_FILTER_ID = 'etheral-svg-filter';

/* ── Tuning: matches demo props (scale:100, speed:90) ──────── */
const DISPLACEMENT_SCALE = 100;       // px of warp
const HUE_INCREMENT_PER_FRAME = 1.05; // degrees/frame @ ~60fps ≈ 6s/revolution
const ETHERAL_COLOR = 'rgba(218, 52, 28, 0.52)'; // F1 red shadow on white

/* ── Module state ──────────────────────────────────────────── */
let _etheralRaf = null;
let _etheralHue = 0;
let _etheralHueEl = null;  // <feColorMatrix> element to update

/* ────────────────────────────────────────────────────────────
   initEtheral()
   Builds the SVG filter + masked color div + noise overlay
   inside #etheral-wrapper, then starts the animation loop.
──────────────────────────────────────────────────────────── */
function initEtheral() {
  const wrapper = document.getElementById('etheral-wrapper');
  if (!wrapper || _etheralRaf) return; // already running

  _etheralHue = 0;

  /* ── SVG filter (hidden, zero-size, just provides the filter) */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden;');
  svg.setAttribute('aria-hidden', 'true');

  /*
   * Filter pipeline (mirrors the React component exactly):
   *  1. feTurbulence   → organic noise field "undulation"
   *  2. feColorMatrix hueRotate (animated) → rotate the noise hues
   *  3. feColorMatrix matrix   → amplify to create hard b/w "circulation"
   *  4. feDisplacementMap #1   → warp SourceGraphic by circulation → "dist"
   *  5. feDisplacementMap #2   → warp "dist" by undulation → "output"
   */
  svg.innerHTML = `
    <defs>
      <filter id="${ETHERAL_FILTER_ID}" x="-30%" y="-30%" width="160%" height="160%"
              color-interpolation-filters="sRGB">
        <feTurbulence
          result="undulation"
          numOctaves="2"
          baseFrequency="0.0005,0.002"
          seed="0"
          type="turbulence"/>
        <feColorMatrix
          id="etheral-hue-node"
          in="undulation"
          type="hueRotate"
          values="0"/>
        <feColorMatrix
          in="dist"
          result="circulation"
          type="matrix"
          values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0"/>
        <feDisplacementMap
          in="SourceGraphic"
          in2="circulation"
          scale="${DISPLACEMENT_SCALE}"
          result="dist"/>
        <feDisplacementMap
          in="dist"
          in2="undulation"
          scale="${DISPLACEMENT_SCALE}"
          result="output"/>
      </filter>
    </defs>`;

  wrapper.appendChild(svg);
  _etheralHueEl = document.getElementById('etheral-hue-node');

  /* ── Displaced layer: sits inset by -DISPLACEMENT_SCALE so warp
        doesn't clip at the edges, then re-centered by the outer overflow:hidden */
  const displaced = document.createElement('div');
  displaced.style.cssText = [
    'position:absolute',
    `inset:-${DISPLACEMENT_SCALE}px`,
    `filter:url(#${ETHERAL_FILTER_ID}) blur(4px)`,
    'will-change:filter',
  ].join(';');

  /* ── Color + mask: fills the displaced layer with a solid color
        shaped by the shadow mask PNG */
  const colorDiv = document.createElement('div');
  colorDiv.style.cssText = [
    `background-color:${ETHERAL_COLOR}`,
    `mask-image:url('${ETHERAL_MASK_URL}')`,
    `-webkit-mask-image:url('${ETHERAL_MASK_URL}')`,
    'mask-size:cover',
    '-webkit-mask-size:cover',
    'mask-repeat:no-repeat',
    '-webkit-mask-repeat:no-repeat',
    'mask-position:center',
    '-webkit-mask-position:center',
    'width:100%',
    'height:100%',
  ].join(';');

  displaced.appendChild(colorDiv);
  wrapper.appendChild(displaced);

  /* ── Noise overlay: fine film grain on top ── */
  const noiseDiv = document.createElement('div');
  noiseDiv.style.cssText = [
    'position:absolute',
    'inset:0',
    `background-image:url('${ETHERAL_NOISE_URL}')`,
    'background-size:240px',
    'background-repeat:repeat',
    'opacity:0.45',
    'pointer-events:none',
  ].join(';');
  wrapper.appendChild(noiseDiv);

  /* ── Animation loop ── */
  const tick = () => {
    _etheralHue = (_etheralHue + HUE_INCREMENT_PER_FRAME) % 360;
    if (_etheralHueEl) {
      _etheralHueEl.setAttribute('values', String(_etheralHue));
    }
    _etheralRaf = requestAnimationFrame(tick);
  };
  _etheralRaf = requestAnimationFrame(tick);
}

/* ────────────────────────────────────────────────────────────
   destroyEtheral()
   Cancels the animation loop and clears the wrapper DOM.
──────────────────────────────────────────────────────────── */
function destroyEtheral() {
  if (_etheralRaf) {
    cancelAnimationFrame(_etheralRaf);
    _etheralRaf = null;
  }
  _etheralHueEl = null;
  const wrapper = document.getElementById('etheral-wrapper');
  if (wrapper) wrapper.innerHTML = '';
}
