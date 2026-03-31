/**
 * token-utils.js
 * Stateless HMAC-signed token helpers for admin auth.
 * No in-memory Set needed — works correctly across all serverless instances.
 *
 * Requires env var:  SESSION_SECRET  (any long random string, min 32 chars)
 */

const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET;

/**
 * Create a signed token: "<randomHex>.<hmac>"
 */
function createToken() {
  if (!SECRET) throw new Error('SESSION_SECRET env var is not set');
  const rand = crypto.randomBytes(32).toString('hex');
  const sig  = crypto.createHmac('sha256', SECRET).update(rand).digest('hex');
  return `${rand}.${sig}`;
}

/**
 * Verify a signed token. Returns true if valid, false otherwise.
 */
function verifyToken(token) {
  if (!SECRET || !token || typeof token !== 'string') return false;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return false;
  const rand     = token.slice(0, dot);
  const sig      = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(rand).digest('hex');
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Build CORS + JSON headers.
 * Uses SITE_URL env var (e.g. "https://artsianmu.netlify.app") to restrict origin.
 * Falls back to '*' only if SITE_URL is not set, so local dev still works.
 */
function buildCorsHeaders() {
  const origin = process.env.SITE_URL ? process.env.SITE_URL.replace(/\/$/, '') : '*';
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Vary': 'Origin',
  };
}

// Re-evaluated per invocation so SITE_URL changes take effect without redeployment
const CORS_HEADERS = buildCorsHeaders();

/** Quick OPTIONS preflight response */
function preflight() {
  return { statusCode: 200, headers: CORS_HEADERS, body: '' };
}

/** 401 Unauthorized response */
function unauthorized() {
  return {
    statusCode: 401,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: 'Unauthorized' }),
  };
}

/** 500 error response */
function serverError(message) {
  return {
    statusCode: 500,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

/** 200 JSON response */
function ok(data) {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  };
}

module.exports = { createToken, verifyToken, CORS_HEADERS, preflight, unauthorized, serverError, ok };
