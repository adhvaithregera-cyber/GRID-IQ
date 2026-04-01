/* ============================================================
   GridIQ — Authentication  |  auth.js
   Firebase Auth (modular SDK v9+) — Google & GitHub OAuth.

   ── SETUP (one-time) ────────────────────────────────────────
   1. Go to https://console.firebase.google.com
   2. Create a project → Add a Web app → copy firebaseConfig
   3. Authentication → Sign-in method → enable Google & GitHub
      (GitHub needs Client ID/Secret from github.com/settings/developers)
   4. Paste your values into FIREBASE_CONFIG below
   ── ─────────────────────────────────────────────────────── */

import { initializeApp }                                     from 'firebase/app';
import { getAnalytics }                                      from 'firebase/analytics';
import { getAuth, signInWithPopup, signOut as fbSignOut,
         onAuthStateChanged,
         GoogleAuthProvider, GithubAuthProvider }            from 'firebase/auth';

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDJ2DaKWEBANaF21kf5kdRL5BL89uPPPrM",
  authDomain:        "grid-iq-520cb.firebaseapp.com",
  projectId:         "grid-iq-520cb",
  storageBucket:     "grid-iq-520cb.firebasestorage.app",
  messagingSenderId: "862615362572",
  appId:             "1:862615362572:web:22dfef581a971be0d16229",
  measurementId:     "G-ZHCKH7LTRY"
};

/* ── Init ─────────────────────────────────────────────────── */
let _auth = null;

function _isConfigured() {
  return FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY';
}

function _getAuth() {
  if (_auth) return _auth;
  if (!_isConfigured()) return null;
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    getAnalytics(app);
    _auth = getAuth(app);
    onAuthStateChanged(_auth, _onAuthStateChanged);
    return _auth;
  } catch (e) {
    console.warn('[GridIQ auth] Firebase init failed:', e.message);
    return null;
  }
}

/* ── Auth state listener ──────────────────────────────────── */
function _onAuthStateChanged(user) {
  _renderAuthBtn(user);
  closeAuthModal();
  if (user) closeUserMenu();
}

/* ── Sign-in providers ────────────────────────────────────── */
function authSignInGoogle() {
  const auth = _getAuth();
  if (!auth) { _showConfigError(); return; }
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  signInWithPopup(auth, provider).catch(_handleAuthError);
}

function authSignInGitHub() {
  const auth = _getAuth();
  if (!auth) { _showConfigError(); return; }
  const provider = new GithubAuthProvider();
  provider.addScope('user:email');
  signInWithPopup(auth, provider).catch(_handleAuthError);
}

function authSignOut() {
  if (!_auth) return;
  fbSignOut(_auth).then(() => closeUserMenu());
}

/* ── UI helpers ───────────────────────────────────────────── */
function _renderAuthBtn(user) {
  const btn = document.getElementById('auth-btn');
  if (!btn) return;
  if (user) {
    btn.dataset.state = 'in';
    btn.innerHTML = user.photoURL
      ? `<img src="${user.photoURL}" class="auth-avatar-img" referrerpolicy="no-referrer" alt="">`
      : `<span class="auth-avatar-init">${_initials(user.displayName || user.email)}</span>`;
    btn.setAttribute('aria-label', 'Account menu');
  } else {
    btn.dataset.state = 'out';
    btn.innerHTML = `<span class="auth-btn-lbl">SIGN IN</span>`;
    btn.setAttribute('aria-label', 'Sign in');
  }
}

function _initials(name) {
  return (name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function _handleAuthError(err) {
  if (err.code === 'auth/popup-closed-by-user') return;
  const msg = document.getElementById('auth-error');
  if (msg) {
    msg.textContent = err.message || 'Sign-in failed. Please try again.';
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 4000);
  }
}

function _showConfigError() {
  const msg = document.getElementById('auth-error');
  if (msg) {
    msg.textContent = 'Firebase is not configured yet — see js/auth.js for setup instructions.';
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 6000);
  }
}

/* ── Modal ────────────────────────────────────────────────── */
function openAuthModal() {
  const m = document.getElementById('auth-modal');
  if (!m) return;
  m.classList.remove('hidden');
  const msg = document.getElementById('auth-error');
  if (msg) msg.classList.add('hidden');
}
function closeAuthModal() {
  const m = document.getElementById('auth-modal');
  if (m) m.classList.add('hidden');
}

/* ── User menu ────────────────────────────────────────────── */
function openUserMenu() {
  const auth = _auth;
  if (!auth || !auth.currentUser) { openAuthModal(); return; }
  const u = auth.currentUser;
  const elName  = document.getElementById('um-name');
  const elEmail = document.getElementById('um-email');
  const elPhoto = document.getElementById('um-photo');
  if (elName)  elName.textContent  = u.displayName || 'GridIQ User';
  if (elEmail) elEmail.textContent = u.email || '';
  if (elPhoto) {
    elPhoto.innerHTML = u.photoURL
      ? `<img src="${u.photoURL}" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="">`
      : _initials(u.displayName || u.email);
  }
  document.getElementById('user-menu')?.classList.toggle('hidden');
}
function closeUserMenu() {
  document.getElementById('user-menu')?.classList.add('hidden');
}

/* ── Auth button click dispatcher ────────────────────────── */
function onAuthBtnClick() {
  _getAuth(); // ensure init
  const btn = document.getElementById('auth-btn');
  if (btn?.dataset.state === 'in') openUserMenu();
  else openAuthModal();
}

/* ── Close menus on outside click ────────────────────────── */
document.addEventListener('click', e => {
  const authBtn   = document.getElementById('auth-btn');
  const userMenu  = document.getElementById('user-menu');
  const authModal = document.getElementById('auth-modal');
  if (userMenu && !userMenu.contains(e.target) && authBtn && !authBtn.contains(e.target)) {
    closeUserMenu();
  }
  if (authModal && !authModal.classList.contains('hidden') && e.target === authModal) {
    closeAuthModal();
  }
});

/* ── Expose functions to global scope (called from HTML onclick) */
window.onAuthBtnClick  = onAuthBtnClick;
window.authSignInGoogle = authSignInGoogle;
window.authSignInGitHub = authSignInGitHub;
window.authSignOut      = authSignOut;
window.closeAuthModal   = closeAuthModal;

/* ── Kick off auth state on load ─────────────────────────── */
_getAuth();
_renderAuthBtn(null); // default signed-out state before Firebase responds
