const { createClient } = require('@supabase/supabase-js');
const { verifyToken, setCors, SUPABASE_URL, SUPABASE_KEY } = require('../../_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const token = req.headers['x-admin-token'];
  if (!verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase
      .from('artisans')
      .select('id, nom, metier, ville, tel, nic, is_verified, created_at, nombre_avis, note_total, avatar')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.status(200).json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
