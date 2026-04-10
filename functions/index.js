/* ============================================================
   GridIQ — Backend  |  functions/index.js
   Firebase Cloud Functions (gen 1, Node 20)

   Serves Firebase client config to the frontend so API keys
   never appear in browser-visible source code.

   Environment variables are set via:
     firebase functions:secrets:set FIREBASE_API_KEY  (production)
   Or via functions/.env (local dev — never commit this file)
   ============================================================ */

const functions = require('firebase-functions');

const ALLOWED_ORIGINS = [
  'https://gridiqapp.com',
  'https://www.gridiqapp.com',
  'http://localhost',
  'http://127.0.0.1',
];

/* ── GET /getConfig — returns Firebase client config ──────── */
exports.getConfig = functions.https.onRequest((req, res) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Cache-Control', 'private, max-age=300'); // 5-min client cache

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  res.json({
    apiKey:            process.env.FIREBASE_API_KEY,
    authDomain:        process.env.FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.FIREBASE_PROJECT_ID,
    storageBucket:     process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.FIREBASE_APP_ID,
    measurementId:     process.env.FIREBASE_MEASUREMENT_ID,
  });
});
