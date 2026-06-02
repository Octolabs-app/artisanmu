const { createClient } = require('@supabase/supabase-js');
const { setCors, SUPABASE_URL, SUPABASE_KEY } = require('../_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing job id' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // POST /api/jobs/:id?action=claim  — artisan claims the job
  if (req.method === 'POST' && req.query.action === 'claim') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { artisan_id } = body || {};
    if (!artisan_id) return res.status(400).json({ error: 'artisan_id required' });

    // Fetch current job state
    const { data: job, error: fetchErr } = await supabase
      .from('job_requests').select('*').eq('id', id).single();
    if (fetchErr || !job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'pending') return res.status(409).json({ error: 'Job already claimed or expired' });

    // Fetch artisan contact info to return to claimer
    const { data: artisan } = await supabase
      .from('artisans').select('id,nom,tel').eq('id', artisan_id).single();

    const claimTimeout = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { data: updated, error: updateErr } = await supabase
      .from('job_requests')
      .update({ status: 'claimed', claimed_by_artisan_id: artisan_id, claim_timeout_at: claimTimeout })
      .eq('id', id).eq('status', 'pending') // double-check still pending
      .select()
      .single();

    if (updateErr || !updated) return res.status(409).json({ error: 'Claim failed — job was taken' });

    return res.status(200).json({
      job: updated,
      client_name: job.client_name,
      client_whatsapp: job.client_whatsapp,
      claim_timeout_at: claimTimeout,
    });
  }

  // POST /api/jobs/:id?action=release  — release expired claim back to pending
  if (req.method === 'POST' && req.query.action === 'release') {
    const { data: job } = await supabase
      .from('job_requests').select('status,claim_timeout_at').eq('id', id).single();
    if (!job || job.status !== 'claimed') return res.status(200).json({ released: false });

    const isExpired = job.claim_timeout_at && new Date(job.claim_timeout_at) < new Date();
    if (!isExpired) return res.status(200).json({ released: false, reason: 'Timer still running' });

    await supabase.from('job_requests')
      .update({ status: 'pending', claimed_by_artisan_id: null, claim_timeout_at: null })
      .eq('id', id);
    return res.status(200).json({ released: true });
  }

  // PATCH /api/jobs/:id  — mark resolved (artisan or admin)
  if (req.method === 'PATCH') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { status } = body || {};
    if (!['resolved', 'expired'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const { error } = await supabase.from('job_requests').update({ status }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
