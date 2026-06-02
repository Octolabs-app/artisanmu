const { createClient } = require('@supabase/supabase-js');
const { verifyAdminToken, CORS_HEADERS, preflight, unauthorized, serverError, ok } = require('./token-utils');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_API_URL || 'https://tlvgcxshiapqswcyyvyq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdmdjeHNoaWFwcXN3Y3l5dnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjk4MDYsImV4cCI6MjA5NTk0NTgwNn0.MVJN-4wU7_cnPPPlX8IVcxDVG3CoPqPHmTebHGbMCVM';

function extractArtisanId(event) {
  if (event.queryStringParameters && event.queryStringParameters.id) return event.queryStringParameters.id;
  const parts = event.path.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : null;
}

function extractFilename(url) {
  if (!url || typeof url !== 'string') return null;
  try { const u = new URL(url); const parts = u.pathname.split('/'); return parts[parts.length - 1] || null; } catch { return null; }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  const token = event.headers['x-admin-token'];
  if (!await verifyAdminToken(token)) return unauthorized();
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  const artisanId = extractArtisanId(event);
  if (!artisanId) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing artisan ID' }) };
  }
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: artisan } = await supabase.from('artisans').select('avatar, photos').eq('id', artisanId).single();
    if (artisan) {
      const filesToDelete = [];
      const avatarFile = extractFilename(artisan.avatar);
      if (avatarFile) filesToDelete.push(avatarFile);
      if (artisan.photos) {
        try {
          const photos = typeof artisan.photos === 'string' ? JSON.parse(artisan.photos) : artisan.photos;
          if (Array.isArray(photos)) photos.forEach(p => { const f = extractFilename(p?.url); if (f) filesToDelete.push(f); });
        } catch {}
      }
      if (filesToDelete.length > 0) await supabase.storage.from('portfolios').remove(filesToDelete);
    }
    const { error } = await supabase.from('artisans').delete().eq('id', artisanId);
    if (error) throw error;
    return ok({ success: true });
  } catch (err) {
    console.error('[admin-delete] Error:', err.message);
    return serverError(err.message);
  }
};
