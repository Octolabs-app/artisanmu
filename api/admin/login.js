const { createToken, setCors, ADMIN_HASH } = require('./_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { passwordHash } = req.body || {};
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
