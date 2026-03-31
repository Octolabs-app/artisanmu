/**
 * artisan-login.js
 * Authenticates an artisan by phone number + NIC.
 *
 * Required env vars:
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *
 * POST  body: { "tel": "...", "nic": "..." }
 */

const { createClient } = require('@supabase/supabase-js');
const { CORS_HEADERS, preflight, serverError, ok } = require('./token-utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[artisan-login] Missing Supabase environment variables');
    return serverError('Server misconfiguration: Supabase environment variables are not set.');
  }

  try {
    const { tel, nic } = JSON.parse(event.body || '{}');

    if (!tel || !nic) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Phone number and NIC are required' }),
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('artisans')
      .select('*')
      .eq('tel', tel)
      .eq('nic', nic)
      .eq('is_verified', true)
      .single();

    if (error || !data) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Invalid credentials or account not yet verified' }),
      };
    }

    return ok({ success: true, artisan: data });
  } catch (err) {
    console.error('[artisan-login] Error:', err.message);
    return serverError(err.message);
  }
};
