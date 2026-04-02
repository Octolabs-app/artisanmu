const { verifyToken, CORS_HEADERS, preflight, unauthorized, ok } = require('./token-utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  const token = event.headers['x-admin-token'];
  if (!verifyToken(token)) return unauthorized();
  return ok({ success: true });
};
