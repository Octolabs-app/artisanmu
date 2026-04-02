const { createToken, setCors, ADMIN_HASH } = require('./_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // Vercel may pass body as string or object depending on content-type
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body = body || {};

    const { passwordHash } = body;
    console.log('[admin-login] received hash:', passwordHash);
    console.log('[admin-login] expected hash:', ADMIN_HASH);

    if (!passwordHash || passwordHash !== ADMIN_HASH) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }
    const token = createToken();
    res.status(200).json({ success: true, token });
  } catch (err) {
    console.error('[admin-login] Error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
