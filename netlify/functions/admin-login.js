/**
 * admin-login.js
 * Verifies the admin password hash and returns a stateless signed token.
 *
 * Required env vars:
 *   ADMIN_PASSWORD_HASH   — SHA-256 hex hash of the admin password
 *   SESSION_SECRET        — random secret for signing tokens (min 32 chars)
 *
 * POST body: { "passwordHash": "<sha256 hex of the password>" }
 *
 * Fixes applied:
 *   - SESSION_SECRET is validated BEFORE calling createToken() (was unhandled throw)
 *   - ADMIN_PASSWORD_HASH is validated with a clear 500 error (was silent mismatch)
 */

const { createToken, CORS_HEADERS, preflight, ok } = require('./token-utils');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // Validate SESSION_SECRET BEFORE calling createToken() — it throws if missing,
    // which would produce a generic 500 with no useful message.
    if (!process.env.SESSION_SECRET) {
      console.error('[admin-login] SESSION_SECRET env var is not set');
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: 'Server misconfiguration: SESSION_SECRET is not set. Add it in Netlify → Environment variables.',
        }),
      };
    }

    // Validate ADMIN_PASSWORD_HASH — without it the comparison would always fail
    // with a misleading "Invalid password" rather than a missing-env-var error.
    if (!process.env.ADMIN_PASSWORD_HASH) {
      console.error('[admin-login] ADMIN_PASSWORD_HASH env var is not set');
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: 'Server misconfiguration: ADMIN_PASSWORD_HASH is not set. Add it in Netlify → Environment variables.',
        }),
      };
    }

    // Both env vars confirmed present — safe to proceed
    const { passwordHash } = JSON.parse(event.body || '{}');

    if (!passwordHash || passwordHash !== process.env.ADMIN_PASSWORD_HASH) {
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Invalid password' }),
      };
    }

    // createToken() is safe — SESSION_SECRET is confirmed set above
    const token = createToken();

    return ok({ success: true, token });
  } catch (err) {
    console.error('[admin-login] Unexpected error:', err.message);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'Internal server error' }),
    };
  }
};
