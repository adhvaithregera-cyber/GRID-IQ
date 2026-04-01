/* ============================================================
   GridIQ — Authentication  |  auth.js
   Firebase Auth (modular SDK v9+)
   Providers: Google, GitHub, Email/Password, Phone (SMS OTP)
   ============================================================ */

import { initializeApp }                                          from 'firebase/app';
import { getAnalytics }                                           from 'firebase/analytics';
import { getAuth, signInWithPopup, signOut as fbSignOut,
         onAuthStateChanged,
         GoogleAuthProvider, GithubAuthProvider,
         createUserWithEmailAndPassword, signInWithEmailAndPassword,
         signInWithPhoneNumber, RecaptchaVerifier }               from 'firebase/auth';

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
let _auth              = null;
let _emailMode         = 'signin';   // 'signin' | 'signup'
let _confirmationResult = null;      // phone OTP confirmation handle
let _recaptchaVerifier  = null;

function _getAuth() {
  if (_auth) return _auth;
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
  if (user) {
    closeUserMenu();
    if (typeof grantOwnerProIfMatch === 'function') {
      grantOwnerProIfMatch(user.email);
    }
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

  // Clear any existing verifier so it can be rebuilt
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
function authShowEmailView() { _switchView('auth-view-email'); }
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
  const messages = {
    'auth/user-not-found':       'No account found with that email.',
    'auth/wrong-password':       'Incorrect password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/invalid-phone-number': 'Invalid phone number — include country code (e.g. +1).',
    'auth/too-many-requests':    'Too many attempts. Please try again later.',
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

/* ── Expose to global scope (HTML onclick needs globals) ─── */
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

/* ── Kick off auth state on load ─────────────────────────── */
_getAuth();
_renderAuthBtn(null);
