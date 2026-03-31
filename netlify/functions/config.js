/**
 * config.js
 * Returns public app config to the frontend.
 * All values come from Netlify environment variables — nothing is hardcoded.
 *
 * Required env vars:
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *   EMAILJS_SERVICE
 *   EMAILJS_TEMPLATE
 *   EMAILJS_PUBLIC_KEY
 *   ADMIN_PHONE         (optional, defaults to '23058289431')
 *
 * Fix applied:
 *   - Now explicitly rejects all methods other than GET with 405
 */

const { CORS_HEADERS, preflight } = require('./token-utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  // Only GET is valid for a config endpoint
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { ...CORS_HEADERS, Allow: 'GET, OPTIONS' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[config] Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error:
          'Server misconfiguration: Supabase environment variables are not set. ' +
          'Add SUPABASE_URL and SUPABASE_ANON_KEY in Netlify → Environment variables, then redeploy.',
      }),
    };
  }

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      supabaseUrl,
      supabaseKey,
      emailjsService:   process.env.EMAILJS_SERVICE    || '',
      emailjsTemplate:  process.env.EMAILJS_TEMPLATE   || '',
      emailjsPublicKey: process.env.EMAILJS_PUBLIC_KEY || '',
      adminPhone:       process.env.ADMIN_PHONE         || '23058289431',
    }),
  };
};
