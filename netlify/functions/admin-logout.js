/**
 * admin-logout.js
 * Stateless logout — verifies the token is valid and returns success.
 * The client is responsible for discarding the token after this call.
 *
 * Required env vars:
 *   SESSION_SECRET
 *
 * POST  headers: { x-admin-token: "<signed token>" }
 */

const { verifyToken, CORS_HEADERS, preflight, unauthorized, ok } = require('./token-utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const token = event.headers['x-admin-token'];
  if (!verifyToken(token)) return unauthorized();

  // With stateless tokens, "logout" is handled entirely on the client side
  // by deleting the token from sessionStorage/memory. We just confirm success.
  return ok({ success: true });
};
