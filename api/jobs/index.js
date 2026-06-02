const { createClient } = require('@supabase/supabase-js');
const { setCors, SUPABASE_URL, SUPABASE_KEY } = require('../_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // GET — list pending jobs for a given district + category (artisan job feed)
  if (req.method === 'GET') {
    const { district, category } = req.query;
    let query = supabase
      .from('job_requests')
      .select('*')
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (district) query = query.eq('district', district);
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    // Strip client contact info from public feed — only revealed on claim
    const safe = (data || []).map(j => ({
      id: j.id, category: j.category, description: j.description,
      image_url: j.image_url, budget_tier: j.budget_tier,
      district: j.district, town: j.town, status: j.status,
      created_at: j.created_at,
    }));
    return res.status(200).json(safe);
  }

  // POST — client submits a job request
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const { category, description, image_url, budget_tier, district, town, client_name, client_whatsapp } = body;
    if (!category || !description || !district || !client_name || !client_whatsapp) {
      return res.status(400).json({ error: 'Missing required fields: category, description, district, client_name, client_whatsapp' });
    }

    const { data, error } = await supabase
      .from('job_requests')
      .insert([{
        category,
        description: description.substring(0, 500),
        image_url: image_url || null,
        budget_tier: ['low', 'mid', 'high'].includes(budget_tier) ? budget_tier : 'mid',
        district,
        town: town || null,
        client_name,
        client_whatsapp,
        status: 'pending',
      }])
      .select('id, status, created_at')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
