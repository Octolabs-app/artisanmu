const { createClient } = require('@supabase/supabase-js');
const { CORS_HEADERS, preflight, serverError, ok } = require('./token-utils');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_API_URL || 'https://tlvgcxshiapqswcyyvyq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdmdjeHNoaWFwcXN3Y3l5dnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjk4MDYsImV4cCI6MjA5NTk0NTgwNn0.MVJN-4wU7_cnPPPlX8IVcxDVG3CoPqPHmTebHGbMCVM';

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const { tel, nic } = JSON.parse(event.body || '{}');
    if (!tel || !nic) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: 'Phone and NIC required' }) };
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase
      .from('artisans').select('*').eq('tel', tel).eq('nic', nic).eq('is_verified', true).single();
    if (error || !data) {
      return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: 'Invalid credentials or account not verified' }) };
    }
    return ok({ success: true, artisan: data });
  } catch (err) {
    console.error('[artisan-login] Error:', err.message);
    return serverError(err.message);
  }
};
