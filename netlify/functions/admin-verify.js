/**
 * admin-verify.js
 * Marks an artisan as verified (admin only).
 *
 * PUT  /api/admin/artisans/:id/verify
 *      headers: { x-admin-token: "<signed token>" }
 */

const { createClient } = require('@supabase/supabase-js');
const { verifyToken, CORS_HEADERS, preflight, unauthorized, serverError, ok } = require('./token-utils');

function extractArtisanId(event) {
  // Netlify passes query string params from redirect splats
  if (event.queryStringParameters && event.queryStringParameters.id) {
    return event.queryStringParameters.id;
  }
  // Reliable fallback: /api/admin/artisans/<id>/verify → second-to-last segment
  const parts = event.path.split('/').filter(Boolean);
  const verifyIndex = parts.lastIndexOf('verify');
  return verifyIndex > 0 ? parts[verifyIndex - 1] : null;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  const token = event.headers['x-admin-token'];
  if (!verifyToken(token)) return unauthorized();

  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const artisanId = extractArtisanId(event);
  if (!artisanId) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing artisan ID in path' }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[admin-verify] Missing Supabase environment variables');
    return serverError('Server misconfiguration: Supabase environment variables are not set.');
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('artisans').update({ is_verified: true }).eq('id', artisanId);
    if (error) throw error;
    return ok({ success: true });
  } catch (err) {
    console.error('[admin-verify] Supabase error:', err.message);
    return serverError(err.message);
  }
};
