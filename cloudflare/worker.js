/* ============================================================
   GridIQ — Cloudflare Worker  |  cloudflare/worker.js

   Single job: return Firebase client config to the frontend.
   Keys are stored as Cloudflare secrets (never in code).

   Deploy:  npx wrangler deploy
   Secrets: npx wrangler secret put FIREBASE_API_KEY  (repeat for each)
   ============================================================ */

const ALLOWED_ORIGINS = [
  'https://gridiqapp.com',
  'https://www.gridiqapp.com',
  'http://localhost',
  'http://127.0.0.1',
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    const corsHeaders = {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (ALLOWED_ORIGINS.includes(origin)) {
      corsHeaders['Access-Control-Allow-Origin'] = origin;
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const config = {
      apiKey:            env.FIREBASE_API_KEY,
      authDomain:        env.FIREBASE_AUTH_DOMAIN,
      projectId:         env.FIREBASE_PROJECT_ID,
      storageBucket:     env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
      appId:             env.FIREBASE_APP_ID,
      measurementId:     env.FIREBASE_MEASUREMENT_ID,
    };

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=300',
      },
    });
  },
};
