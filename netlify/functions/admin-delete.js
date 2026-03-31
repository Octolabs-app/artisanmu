/**
 * admin-delete.js
 * Deletes an artisan and their storage files (admin only).
 *
 * DELETE  /api/admin/artisans/:id
 *         headers: { x-admin-token: "<signed token>" }
 */

const { createClient } = require('@supabase/supabase-js');
const { verifyToken, CORS_HEADERS, preflight, unauthorized, serverError, ok } = require('./token-utils');

function extractArtisanId(event) {
  if (event.queryStringParameters && event.queryStringParameters.id) {
    return event.queryStringParameters.id;
  }
  // Reliable fallback: /api/admin/artisans/<id> → last segment
  const parts = event.path.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : null;
}

function extractFilename(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/');
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  const token = event.headers['x-admin-token'];
  if (!verifyToken(token)) return unauthorized();

  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const artisanId = extractArtisanId(event);
  if (!artisanId) {
    return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing artisan ID in path' }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[admin-delete] Missing Supabase environment variables');
    return serverError('Server misconfiguration: Supabase environment variables are not set.');
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: artisan, error: fetchError } = await supabase
      .from('artisans').select('avatar, photos').eq('id', artisanId).single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (artisan) {
      const filesToDelete = [];
      const avatarFile = extractFilename(artisan.avatar);
      if (avatarFile) filesToDelete.push(avatarFile);
      if (artisan.photos) {
        try {
          const photos = typeof artisan.photos === 'string' ? JSON.parse(artisan.photos) : artisan.photos;
          if (Array.isArray(photos)) {
            photos.forEach(p => { const f = extractFilename(p?.url); if (f) filesToDelete.push(f); });
          }
        } catch (e) { console.warn('[admin-delete] Could not parse photos JSON:', e.message); }
      }
      if (filesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage.from('portfolios').remove(filesToDelete);
        if (storageError) console.warn('[admin-delete] Storage cleanup warning:', storageError.message);
      }
    }

    const { error: deleteError } = await supabase.from('artisans').delete().eq('id', artisanId);
    if (deleteError) throw deleteError;

    return ok({ success: true });
  } catch (err) {
    console.error('[admin-delete] Error:', err.message);
    return serverError(err.message);
  }
};
