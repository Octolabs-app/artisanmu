const { createClient } = require('@supabase/supabase-js');
const { setCors, SUPABASE_URL, SUPABASE_KEY } = require('../_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { tel, nic } = req.body || {};
    if (!tel || !nic) return res.status(400).json({ success: false, error: 'Phone and NIC required' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase
      .from('artisans').select('*').eq('tel', tel).eq('nic', nic).eq('is_verified', true).single();

    if (error || !data) {
      return res.status(401).json({ success: false, error: 'Invalid credentials or account not verified' });
    }
    res.status(200).json({ success: true, artisan: data });
  } catch (err) {
    console.error('[artisan-login] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
