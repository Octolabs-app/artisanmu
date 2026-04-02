/**
 * _utils.js — shared helpers for Vercel API routes
 */
const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET || '8a714bf43a1c4628a4619237e6dc738fcc3a28d3119c0c403a6ac5a706fed3255ca40c1a78f2bbc228310492f6d58ee9';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_API_URL || 'https://sypwtcndehuroudbnzdw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cHd0Y25kZWh1cm91ZGJuemR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0Mzk4ODIsImV4cCI6MjA5MDAxNTg4Mn0.UEnCPdflKWXPeSJ1TgzeZom5DcGSh9CV7ZnGnO4Illk';
const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH || '1b69daffcbaab2993ce50e55628021260f2ab54902ddf0b491f99c1784e67e87';

function createToken() {
  const rand = crypto.randomBytes(32).toString('hex');
  const sig  = crypto.createHmac('sha256', SECRET).update(rand).digest('hex');
  return `${rand}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return false;
  const dot = token.lastIndexOf('.');
  if (dot === -1) return false;
  const rand = token.slice(0, dot);
  const sig  = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', SECRET).update(rand).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch { return false; }
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
}

module.exports = { createToken, verifyToken, setCors, SUPABASE_URL, SUPABASE_KEY, ADMIN_HASH };
