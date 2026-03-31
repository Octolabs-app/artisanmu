/**
 * admin-artisans.js
 * Returns list of all artisans (admin only).
 *
 * Required env vars:
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *   SESSION_SECRET
 *
 * GET  headers: { x-admin-token: "<signed token>" }
 */

const { createClient } = require('@supabase/supabase-js');
const { verifyToken, CORS_HEADERS, preflight, unauthorized, serverError, ok } = require('./token-utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  // Verify admin token (stateless HMAC — works across all serverless instances)
  const token = event.headers['x-admin-token'];
  if (!verifyToken(token)) return unauthorized();

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[admin-artisans] Missing Supabase environment variables');
    return serverError('Server misconfiguration: Supabase environment variables are not set.');
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('artisans')
      .select('id, nom, metier, ville, tel, nic, is_verified, created_at, nombre_avis, note_total, avatar')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return ok(data || []);
  } catch (err) {
    console.error('[admin-artisans] Supabase error:', err.message);
    return serverError(err.message);
  }
};
