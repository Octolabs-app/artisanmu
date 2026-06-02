/**
 * token-utils.js
 * Stateless HMAC-signed token helpers for admin auth.
 * Works across all serverless instances (Netlify & Vercel).
 */

const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET || '8a714bf43a1c4628a4619237e6dc738fcc3a28d3119c0c403a6ac5a706fed3255ca40c1a78f2bbc228310492f6d58ee9';

function createToken() {
  if (!SECRET) throw new Error('SESSION_SECRET env var is not set');
  const rand = crypto.randomBytes(32).toString('hex');
  const sig  = crypto.createHmac('sha256', SECRET).update(rand).digest('hex');
  return `${rand}.${sig}`;
}

function verifyToken(token) {
  if (!SECRET || !token || typeof token !== 'string') return false;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return false;
  const rand     = token.slice(0, dot);
  const sig      = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(rand).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

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

const CORS_HEADERS = buildCorsHeaders();

function preflight() {
  return { statusCode: 200, headers: CORS_HEADERS, body: '' };
}

function unauthorized() {
  return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Unauthorized' }) };
}

function serverError(message) {
  return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: message }) };
}

function ok(data) {
  return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(data) };
}

async function verifyAdminToken(token) {
  if (!token) return false;
  if (verifyToken(token)) return true;
  try {
    const { createClient } = require('@supabase/supabase-js');
    const url = process.env.SUPABASE_URL || 'https://tlvgcxshiapqswcyyvyq.supabase.co';
    const key = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdmdjeHNoaWFwcXN3Y3l5dnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjk4MDYsImV4cCI6MjA5NTk0NTgwNn0.MVJN-4wU7_cnPPPlX8IVcxDVG3CoPqPHmTebHGbMCVM';
    const supabase = createClient(url, key);
    const { data, error } = await supabase.auth.getUser(token);
    return !error && !!data?.user;
  } catch { return false; }
}

module.exports = { createToken, verifyToken, verifyAdminToken, CORS_HEADERS, preflight, unauthorized, serverError, ok };
