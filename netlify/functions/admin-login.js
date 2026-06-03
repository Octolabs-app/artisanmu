const { createToken, CORS_HEADERS, preflight, ok } = require('./token-utils');

const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH || 'fe3ffd2d9a9aaced48c32c451afd6c81ca0a68beb6873dbcb3717755a0150bd9';

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  try {
    const { passwordHash } = JSON.parse(event.body || '{}');
    if (!passwordHash || passwordHash !== ADMIN_HASH) {
      return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: 'Invalid password' }) };
    }
    const token = createToken();
    return ok({ success: true, token });
  } catch (err) {
    console.error('[admin-login] Error:', err.message);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: 'Internal server error' }) };
  }
};
