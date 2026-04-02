const { createClient } = require('@supabase/supabase-js');
const { verifyToken, setCors, SUPABASE_URL, SUPABASE_KEY } = require('../../../_utils');

function getFilename(url) {
  try { return new URL(url).pathname.split('/').pop(); } catch { return null; }
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const token = req.headers['x-admin-token'];
  if (!verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' });

  // id and optional action come from vercel.json route capture
  const id = req.query.id;
  const action = req.query.action; // 'verify' when matched /artisans/:id/verify

  if (!id) return res.status(400).json({ error: 'Missing artisan ID' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // PUT /api/admin/artisans/:id/verify
  if (req.method === 'PUT' && action === 'verify') {
    try {
      const { error } = await supabase.from('artisans').update({ is_verified: true }).eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE /api/admin/artisans/:id
  if (req.method === 'DELETE') {
    try {
      const { data: artisan } = await supabase.from('artisans').select('avatar, photos').eq('id', id).single();
      if (artisan) {
        const filesToDelete = [];
        if (artisan.avatar) { const f = getFilename(artisan.avatar); if (f) filesToDelete.push(f); }
        if (artisan.photos) {
          try {
            const photos = typeof artisan.photos === 'string' ? JSON.parse(artisan.photos) : artisan.photos;
            if (Array.isArray(photos)) photos.forEach(p => { const f = getFilename(p?.url); if (f) filesToDelete.push(f); });
          } catch {}
        }
        if (filesToDelete.length > 0) await supabase.storage.from('portfolios').remove(filesToDelete);
      }
      const { error } = await supabase.from('artisans').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method Not Allowed' });
};
