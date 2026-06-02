const { createClient } = require('@supabase/supabase-js');
const { verifyAdminToken, CORS_HEADERS, preflight, unauthorized, serverError, ok } = require('./token-utils');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_API_URL || 'https://tlvgcxshiapqswcyyvyq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdmdjeHNoaWFwcXN3Y3l5dnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjk4MDYsImV4cCI6MjA5NTk0NTgwNn0.MVJN-4wU7_cnPPPlX8IVcxDVG3CoPqPHmTebHGbMCVM';

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  const token = event.headers['x-admin-token'];
  if (!await verifyAdminToken(token)) return unauthorized();
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase
      .from('artisans')
      .select('id, nom, metier, ville, tel, nic, is_verified, created_at, nombre_avis, note_total, avatar')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ok(data || []);
  } catch (err) {
    console.error('[admin-artisans] Error:', err.message);
    return serverError(err.message);
  }
};
