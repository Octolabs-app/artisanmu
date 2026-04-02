const { verifyToken, setCors } = require('../_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const token = req.headers['x-admin-token'];
  if (!verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' });
  res.status(200).json({ success: true });
};
