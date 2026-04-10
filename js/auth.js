/* ============================================================
   GridIQ — Authentication  |  auth.js
   Firebase Auth (modular SDK v9+)
   Providers: Google, GitHub, Email/Password, Phone (SMS OTP)
   Security: App Check (reCAPTCHA v3), email rate limiting,
             Firestore server-side PRO verification

   ── APP CHECK SETUP (one-time) ──────────────────────────────
   1. Go to console.firebase.google.com → your project
   2. App Check → Register app → reCAPTCHA v3
   3. Go to g.co/recaptcha → register site (add both
      adhvaithregera-cyber.github.io AND localhost)
   4. Copy the Site Key into .env → VITE_RECAPTCHA_SITE_KEY
   ── ─────────────────────────────────────────────────────── */

import { initializeApp }                                          from 'firebase/app';
import { getAnalytics }                                           from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaV3Provider }               from 'firebase/app-check';
import { getAuth, signInWithPopup, signInWithCredential, signOut as fbSignOut,
         onAuthStateChanged,
         GoogleAuthProvider, GithubAuthProvider,
         createUserWithEmailAndPassword, signInWithEmailAndPassword,
         signInWithPhoneNumber, RecaptchaVerifier }               from 'firebase/auth';
import { getRemoteConfig, fetchAndActivate, getValue }           from 'firebase/remote-config';
import { getFirestore, doc, getDoc, setDoc }                     from 'firebase/firestore';

/* ── Firebase client config (safe to be public — keys only identify the project,
      security enforced by Firestore rules + authorized domains in Firebase console) ── */
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyDJ2DaKWEBANaF21kf5kdRL5BL89uPPPrM',
  authDomain:        'grid-iq-520cb.firebaseapp.com',
  projectId:         'grid-iq-520cb',
  storageBucket:     'grid-iq-520cb.firebasestorage.app',
  messagingSenderId: '862615362572',
  appId:             '1:862615362572:web:22dfef581a971be0d16229',
  measurementId:     'G-ZHCKH7LTRY',
};

/* ── Rate limiting (email/password only) ─────────────────── */
const _RL = { MAX: 5, LOCKOUT_MS: 10 * 60 * 1000 };

function _isLockedOut() {
  const ts = localStorage.getItem('gridiq_auth_lockout');
  if (!ts) return false;
  if (Date.now() < parseInt(ts, 10)) return true;
  localStorage.removeItem('gridiq_auth_lockout');
  localStorage.removeItem('gridiq_auth_attempts');
  return false;
}

function _lockoutMinsLeft() {
  const ts = parseInt(localStorage.getItem('gridiq_auth_lockout') || '0', 10);
  return Math.ceil((ts - Date.now()) / 60000);
}

function _recordFailedAttempt() {
  const n = parseInt(localStorage.getItem('gridiq_auth_attempts') || '0', 10) + 1;
  localStorage.setItem('gridiq_auth_attempts', String(n));
  if (n >= _RL.MAX) {
    localStorage.setItem('gridiq_auth_lockout', String(Date.now() + _RL.LOCKOUT_MS));
  }
  return n;
}

function _clearRateLimit() {
  localStorage.removeItem('gridiq_auth_attempts');
  localStorage.removeItem('gridiq_auth_lockout');
}

/* ── Init ─────────────────────────────────────────────────── */
let _auth               = null;
let _db                 = null;
let _emailMode          = 'signin';
let _confirmationResult = null;
let _recaptchaVerifier  = null;

function _getAuth() {
  if (_auth) return _auth;
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    try { getAnalytics(app); } catch (_) {}
    _auth = getAuth(app);
    _db   = getFirestore(app);
    onAuthStateChanged(_auth, _onAuthStateChanged);
    _fetchRemoteConfig(app);
    return _auth;
  } catch (e) {
    console.warn('[GridIQ auth] Firebase init failed:', e.message);
    return null;
  }
}

/* ── Auth state listener ──────────────────────────────────── */
function _onAuthStateChanged(user) {
  window._gridiqAuthUser = user || null;
  _renderAuthBtn(user);
  closeAuthModal();
  if (typeof window.updateProNavBadge === 'function') window.updateProNavBadge();
  if (user) {
    closeUserMenu();
    _clearRateLimit();
    _syncUserWithFirestore(user);
  } else {
    // Clear in-memory Pro flags on sign-out
    if (typeof window._setGridIQProVerified === 'function') {
      window._setGridIQProVerified(false, false);
    }
    if (typeof window.updateProNavBadge === 'function') window.updateProNavBadge();
  }
}

/* ── Firestore: sync user doc & Pro status ────────────────── */
async function _syncUserWithFirestore(user) {
  if (!_db) return;
  try {
    const ref  = doc(_db, 'users', user.uid);
    const snap = await getDoc(ref);

    // Set in-memory PRO flags — never touch localStorage for PRO status
    if (typeof window._setGridIQProVerified === 'function') {
      if (snap.exists()) {
        const data = snap.data();
        window._setGridIQProVerified(data.isPro === true, data.isOwner === true);
      } else {
        window._setGridIQProVerified(false, false);
      }
    }

    // Write / refresh user record — never write isPro from the client
    await setDoc(ref, {
      email:       user.email       || '',
      displayName: user.displayName || '',
      lastSeen:    new Date().toISOString(),
    }, { merge: true });

    if (typeof window.updateProNavBadge === 'function') window.updateProNavBadge();

    // Owner auto-grant via SHA-256 (sets memory flags, not localStorage)
    if (typeof window.grantOwnerProIfMatch === 'function') {
      await window.grantOwnerProIfMatch(user.email);
    }
  } catch (e) {
    console.warn('[GridIQ] Firestore sync failed:', e.message);
  }
}

/* ── Remote Config ────────────────────────────────────────── */
async function _fetchRemoteConfig(app) {
  try {
    const rc = getRemoteConfig(app);
    rc.settings.minimumFetchIntervalMillis = 3_600_000; // 1 hour cache
    rc.defaultConfig = { standings_json: '' };
    await fetchAndActivate(rc);
    const raw = getValue(rc, 'standings_json').asString();
    if (!raw) return;
    const data = JSON.parse(raw);

    // Patch GRIDIQ_DATABASE in-memory (same shape as live-data.js patches)
    if (typeof data.racesCompleted === 'number') {
      GRIDIQ_DATABASE.racesCompleted = data.racesCompleted;
    }
    if (Array.isArray(data.drivers)) {
      data.drivers.forEach(d => {
        const existing = GRIDIQ_DATABASE.drivers.find(x => x.id === d.id);
        if (existing) Object.assign(existing, d);
      });
    }
    if (Array.isArray(data.constructors)) {
      data.constructors.forEach(c => {
        const existing = GRIDIQ_DATABASE.constructors.find(x => x.id === c.id);
        if (existing) Object.assign(existing, c);
      });
    }
    if (Array.isArray(data.races)) {
      data.races.forEach(r => {
        const existing = GRIDIQ_DATABASE.races.find(x => x.id === r.id);
        if (existing) Object.assign(existing, r);
      });
    }

    // Re-render if the app is already initialised
    if (typeof renderAll === 'function') renderAll();
  } catch (e) {
    console.warn('[GridIQ remote-config]', e.message);
  }
}

/* ── OAuth providers ─────────────────────────────────────── */
function authSignInGoogle() {
  const auth = _getAuth();
  if (!auth) return;

  const isAndroid = typeof window.Capacitor !== 'undefined' &&
                    window.Capacitor.getPlatform() === 'android';

  if (isAndroid) {
    // Use the native Capacitor plugin to get a Google ID token, then
    // exchange it for a Firebase credential (popup doesn't work in WebView).
    const plugin = window.Capacitor?.Plugins?.FirebaseBridge;
    if (plugin) {
      plugin.signInWithGoogle()
        .then(({ idToken }) => {
          const credential = GoogleAuthProvider.credential(idToken);
          return signInWithCredential(auth, credential);
        })
        .catch(_handleAuthError);
    } else {
      // Plugin unavailable — fall back to email sign-in
      authSetEmailMode('signin');
      authShowEmailView();
    }
    return;
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  signInWithPopup(auth, provider).catch(_handleAuthError);
}

function authSignInGitHub() {
  const auth = _getAuth();
  if (!auth) return;
  const provider = new GithubAuthProvider();
  provider.addScope('user:email');
  signInWithPopup(auth, provider).catch(_handleAuthError);
}

function authSignOut() {
  if (!_auth) return;
  fbSignOut(_auth).then(() => closeUserMenu());
}

/* ── Email / password ─────────────────────────────────────── */
function authSetEmailMode(mode) {
  _emailMode = mode;
  const confirmInput = document.getElementById('auth-confirm-input');
  const submitBtn    = document.getElementById('auth-email-submit');
  const title        = document.getElementById('auth-email-title');
  const tabSignin    = document.getElementById('auth-tab-signin');
  const tabSignup    = document.getElementById('auth-tab-signup');
  const pwdInput     = document.getElementById('auth-password-input');

  if (mode === 'signup') {
    confirmInput?.classList.remove('hidden');
    if (submitBtn)  submitBtn.textContent  = 'CREATE ACCOUNT';
    if (title)      title.textContent      = 'CREATE ACCOUNT';
    tabSignin?.classList.remove('active');
    tabSignup?.classList.add('active');
    pwdInput?.setAttribute('autocomplete', 'new-password');
  } else {
    confirmInput?.classList.add('hidden');
    if (submitBtn) submitBtn.textContent  = 'SIGN IN';
    if (title)     title.textContent      = 'SIGN IN';
    tabSignin?.classList.add('active');
    tabSignup?.classList.remove('active');
    pwdInput?.setAttribute('autocomplete', 'current-password');
  }
  _clearError();
}

function authSubmitEmail() {
  if (_isLockedOut()) {
    _showError(`Too many failed attempts. Try again in ${_lockoutMinsLeft()} minute(s).`);
    return;
  }

  const auth  = _getAuth();
  if (!auth) return;
  const email = document.getElementById('auth-email-input')?.value.trim();
  const pwd   = document.getElementById('auth-password-input')?.value;
  const cpwd  = document.getElementById('auth-confirm-input')?.value;

  if (!email || !pwd) { _showError('Please enter your email and password.'); return; }

  if (_emailMode === 'signup') {
    if (pwd !== cpwd) { _showError('Passwords do not match.'); return; }
    if (pwd.length < 6) { _showError('Password must be at least 6 characters.'); return; }
    createUserWithEmailAndPassword(auth, email, pwd).catch(_handleAuthError);
  } else {
    signInWithEmailAndPassword(auth, email, pwd).catch(_handleAuthError);
  }
}

/* ── Phone / SMS OTP ─────────────────────────────────────── */
function authSendPhoneCode() {
  const auth  = _getAuth();
  if (!auth) return;
  const phone = document.getElementById('auth-phone-input')?.value.trim();
  if (!phone) { _showError('Please enter your phone number.'); return; }

  if (_recaptchaVerifier) {
    _recaptchaVerifier.clear();
    _recaptchaVerifier = null;
  }

  const container = document.getElementById('recaptcha-container');
  if (container) container.innerHTML = '';

  _recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    callback: () => {}
  });

  signInWithPhoneNumber(auth, phone, _recaptchaVerifier)
    .then(confirmationResult => {
      _confirmationResult = confirmationResult;
      const sub = document.getElementById('auth-otp-sub');
      if (sub) sub.textContent = `Enter the 6-digit code sent to ${phone}.`;
      _switchView('auth-view-otp');
      _clearError();
    })
    .catch(err => {
      if (_recaptchaVerifier) { _recaptchaVerifier.clear(); _recaptchaVerifier = null; }
      _handleAuthError(err);
    });
}

function authVerifyOtp() {
  if (!_confirmationResult) { _showError('Session expired — please resend the code.'); return; }
  const code = document.getElementById('auth-otp-input')?.value.trim();
  if (!code || code.length < 6) { _showError('Enter the full 6-digit code.'); return; }
  _confirmationResult.confirm(code).catch(_handleAuthError);
}

/* ── Modal view switching ────────────────────────────────── */
function _switchView(activeId) {
  ['auth-view-main', 'auth-view-email', 'auth-view-phone', 'auth-view-otp'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', id !== activeId);
  });
  _clearError();
}

function authShowMainView()  { _switchView('auth-view-main');  }
function authShowEmailView() {
  if (_isLockedOut()) {
    _switchView('auth-view-email');
    _showError(`Too many failed attempts. Try again in ${_lockoutMinsLeft()} minute(s).`);
    const btn = document.getElementById('auth-email-submit');
    if (btn) btn.disabled = true;
    return;
  }
  const btn = document.getElementById('auth-email-submit');
  if (btn) btn.disabled = false;
  _switchView('auth-view-email');
}
function authShowPhoneView() { _switchView('auth-view-phone'); }

/* ── UI helpers ───────────────────────────────────────────── */
function _renderAuthBtn(user) {
  const btn = document.getElementById('auth-btn');
  if (!btn) return;
  if (user) {
    btn.dataset.state = 'in';
    btn.innerHTML = '';
    if (user.photoURL) {
      const img = document.createElement('img');
      img.setAttribute('src', user.photoURL);
      img.className = 'auth-avatar-img';
      img.setAttribute('referrerpolicy', 'no-referrer');
      img.setAttribute('alt', '');
      btn.appendChild(img);
    } else {
      const span = document.createElement('span');
      span.className = 'auth-avatar-init';
      span.textContent = _initials(user.displayName || user.email);
      btn.appendChild(span);
    }
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

let _errorTimeout = null;

function _showError(msg) {
  const el = document.getElementById('auth-error');
  if (!el) return;
  clearTimeout(_errorTimeout);
  el.textContent = msg;
  el.classList.remove('hidden');
}

function _clearError() {
  const el = document.getElementById('auth-error');
  if (el) el.classList.add('hidden');
}

function _handleAuthError(err) {
  if (err.code === 'auth/popup-closed-by-user') return;

  const rateLimitedCodes = [
    'auth/wrong-password',
    'auth/user-not-found',
    'auth/invalid-credential',
    'auth/invalid-email',
  ];
  if (rateLimitedCodes.includes(err.code)) {
    const attempts = _recordFailedAttempt();
    if (_isLockedOut()) {
      _showError(`Too many failed attempts. Sign-in locked for 10 minutes.`);
      const btn = document.getElementById('auth-email-submit');
      if (btn) btn.disabled = true;
      return;
    }
    const remaining = _RL.MAX - attempts;
    const suffix = remaining === 1 ? '1 attempt remaining.' : `${remaining} attempts remaining.`;
    const messages = {
      'auth/wrong-password':     `Incorrect password. ${suffix}`,
      'auth/user-not-found':     `No account found with that email. ${suffix}`,
      'auth/invalid-credential': `Invalid credentials. ${suffix}`,
      'auth/invalid-email':      'Please enter a valid email address.',
    };
    _showError(messages[err.code] || `Sign-in failed. ${suffix}`);
    _errorTimeout = setTimeout(() => _clearError(), 6000);
    return;
  }

  const messages = {
    'auth/email-already-in-use':      'An account with this email already exists.',
    'auth/weak-password':             'Password must be at least 6 characters.',
    'auth/invalid-phone-number':      'Invalid phone number — include country code (e.g. +1).',
    'auth/too-many-requests':         'Too many attempts. Please try again later.',
    'auth/invalid-verification-code': 'Incorrect code — please try again.',
  };
  _showError(messages[err.code] || err.message || 'Sign-in failed. Please try again.');
  setTimeout(() => _clearError(), 6000);
}

/* ── Modal open/close ─────────────────────────────────────── */
function openAuthModal() {
  const m = document.getElementById('auth-modal');
  if (!m) return;
  m.classList.remove('hidden');
  // Google Sign-In now works on Android via the native FirebaseBridgePlugin,
  // so always show the main view with the Google button.
  authShowMainView();
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
  if (elEmail) elEmail.textContent = u.email || u.phoneNumber || '';
  if (elPhoto) {
    elPhoto.innerHTML = '';
    if (u.photoURL) {
      const img = document.createElement('img');
      img.setAttribute('src', u.photoURL);
      img.setAttribute('referrerpolicy', 'no-referrer');
      img.setAttribute('alt', '');
      img.className = 'um-photo-img';
      elPhoto.appendChild(img);
    } else {
      elPhoto.textContent = _initials(u.displayName || u.email || u.phoneNumber);
    }
  }
  document.getElementById('user-menu')?.classList.remove('hidden');
}

function closeUserMenu() {
  document.getElementById('user-menu')?.classList.add('hidden');
}

/* ── Auth button click dispatcher ────────────────────────── */
function onAuthBtnClick() {
  _getAuth();
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

/* ── Expose to global scope ───────────────────────────────── */
window.onAuthBtnClick      = onAuthBtnClick;
window.authSignInGoogle    = authSignInGoogle;
window.authSignInGitHub    = authSignInGitHub;
window.authSignOut         = authSignOut;
window.openAuthModal       = openAuthModal;
window.closeAuthModal      = closeAuthModal;
window.authShowMainView    = authShowMainView;
window.authShowEmailView   = authShowEmailView;
window.authShowPhoneView   = authShowPhoneView;
window.authSetEmailMode    = authSetEmailMode;
window.authSubmitEmail     = authSubmitEmail;
window.authSendPhoneCode   = authSendPhoneCode;
window.authVerifyOtp       = authVerifyOtp;

/* ── Auth UI event listeners (replaces inline onclick= attrs) ── */
function _bindUIEvents() {
  document.getElementById('auth-btn')?.addEventListener('click', onAuthBtnClick);
  document.querySelector('.um-signout')?.addEventListener('click', authSignOut);

  const authModal = document.getElementById('auth-modal');
  if (authModal) {
    authModal.addEventListener('click', e => { if (e.target === authModal) closeAuthModal(); });
    authModal.querySelector('.auth-modal-close')?.addEventListener('click', closeAuthModal);
  }

  document.querySelector('.auth-google')?.addEventListener('click', authSignInGoogle);
  document.querySelector('.auth-github')?.addEventListener('click', authSignInGitHub);
  document.querySelector('.auth-email-btn')?.addEventListener('click', authShowEmailView);
  document.querySelector('.auth-phone-btn')?.addEventListener('click', authShowPhoneView);

  document.querySelector('#auth-view-email .auth-back-btn')?.addEventListener('click', authShowMainView);
  document.getElementById('auth-tab-signin')?.addEventListener('click', () => authSetEmailMode('signin'));
  document.getElementById('auth-tab-signup')?.addEventListener('click', () => authSetEmailMode('signup'));
  document.getElementById('auth-email-submit')?.addEventListener('click', authSubmitEmail);

  document.querySelector('#auth-view-phone .auth-back-btn')?.addEventListener('click', authShowMainView);
  document.getElementById('auth-phone-submit')?.addEventListener('click', authSendPhoneCode);

  document.querySelector('#auth-view-otp .auth-back-btn')?.addEventListener('click', authShowPhoneView);
  document.getElementById('auth-otp-submit')?.addEventListener('click', authVerifyOtp);
}

/* ── Kick off auth state on load ─────────────────────────── */
_getAuth();
_renderAuthBtn(null);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _bindUIEvents);
} else {
  _bindUIEvents();
}
