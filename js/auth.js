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
import { getAuth, signInWithPopup, signOut as fbSignOut,
         onAuthStateChanged,
         GoogleAuthProvider, GithubAuthProvider,
         createUserWithEmailAndPassword, signInWithEmailAndPassword,
         signInWithPhoneNumber, RecaptchaVerifier }               from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc }                     from 'firebase/firestore';

/* ── Config — values injected by Vite at build time ─────── */
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyDJ2DaKWEBANaF21kf5kdRL5BL89uPPPrM',
  authDomain:        'grid-iq-520cb.firebaseapp.com',
  projectId:         'grid-iq-520cb',
  storageBucket:     'grid-iq-520cb.firebasestorage.app',
  messagingSenderId: '862615362572',
  appId:             '1:862615362572:web:22dfef581a971be0d16229',
  measurementId:     'G-ZHCKH7LTRY',
};
const RECAPTCHA_SITE_KEY = '';

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
    getAnalytics(app);
    if (RECAPTCHA_SITE_KEY && RECAPTCHA_SITE_KEY !== 'PASTE_RECAPTCHA_V3_SITE_KEY_HERE') {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
        isTokenAutoRefreshEnabled: true
      });
    }
    _auth = getAuth(app);
    _db   = getFirestore(app);
    onAuthStateChanged(_auth, _onAuthStateChanged);
    return _auth;
  } catch (e) {
    console.warn('[GridIQ auth] Firebase init failed:', e.message);
    return null;
  }
}

/* ── Server-side PRO sync ─────────────────────────────────── */
/*
 * Reads the user's PRO status from Firestore (the authoritative source).
 * If Firestore says not PRO → clear the localStorage flag so it can't be
 * faked by opening DevTools. If Firestore says PRO → confirm the flag.
 */
async function _syncProFromFirestore(uid) {
  if (!_db || !uid) return;
  try {
    const snap = await getDoc(doc(_db, 'users', uid));
    if (snap.exists()) {
      const data = snap.data();
      if (data.isPro) {
        localStorage.setItem('gridiq_pro', 'true');
      } else {
        // Server says not PRO — strip any locally-set flag
        localStorage.removeItem('gridiq_pro');
      }
      if (data.isOwner) {
        localStorage.setItem('gridiq_owner', 'true');
        localStorage.removeItem('gridiq_trial_start');
      }
    } else {
      // No Firestore record → not a paid user; remove any stale pro flag
      localStorage.removeItem('gridiq_pro');
    }
    if (typeof updateProNavBadge === 'function') updateProNavBadge();
  } catch (e) {
    // Firestore read failed (offline, rules, etc.) — keep existing localStorage state
    console.warn('[GridIQ auth] Firestore PRO sync failed:', e.message);
  }
}

/*
 * Writes owner PRO status to Firestore for the current user.
 * Only runs for emails in OWNER_EMAILS (defined in pro.js).
 * Firestore Security Rules must allow writes only from this function
 * (enforced by denying client writes in rules.firestore).
 */
async function _writeOwnerToFirestore(uid) {
  if (!_db || !uid) return;
  try {
    await setDoc(doc(_db, 'users', uid), { isPro: true, isOwner: true }, { merge: true });
  } catch (e) {
    console.warn('[GridIQ auth] Firestore owner write failed:', e.message);
  }
}

/* ── Auth state listener ──────────────────────────────────── */
function _onAuthStateChanged(user) {
  // Expose auth state to pro.js so isGridIQPro() can trust localStorage only when signed in
  window._gridiqAuthUser = user || null;

  _renderAuthBtn(user);
  closeAuthModal();
  if (user) {
    closeUserMenu();
    _clearRateLimit();
    // Owner check (sets localStorage immediately, then confirms via Firestore)
    if (typeof grantOwnerProIfMatch === 'function') {
      const wasOwner = grantOwnerProIfMatch(user.email);
      if (wasOwner) _writeOwnerToFirestore(user.uid);
    }
    // Always sync PRO status from Firestore (authoritative source)
    _syncProFromFirestore(user.uid);
  } else {
    // Signed out — strip PRO flags that require auth (owner/paid)
    // Leave trial flag alone (trial doesn't require sign-in)
    localStorage.removeItem('gridiq_pro');
    localStorage.removeItem('gridiq_owner');
    if (typeof updateProNavBadge === 'function') updateProNavBadge();
  }
}

/* ── OAuth providers ─────────────────────────────────────── */
function authSignInGoogle() {
  const auth = _getAuth();
  if (!auth) return;
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

function _showError(msg) {
  const el = document.getElementById('auth-error');
  if (!el) return;
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
    setTimeout(() => _clearError(), 6000);
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
    elPhoto.innerHTML = u.photoURL
      ? `<img src="${u.photoURL}" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="">`
      : _initials(u.displayName || u.email || u.phoneNumber);
  }
  document.getElementById('user-menu')?.classList.toggle('hidden');
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
