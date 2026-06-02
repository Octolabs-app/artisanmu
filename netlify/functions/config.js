const { CORS_HEADERS, preflight } = require('./token-utils');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_API_URL || 'https://tlvgcxshiapqswcyyvyq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdmdjeHNoaWFwcXN3Y3l5dnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjk4MDYsImV4cCI6MjA5NTk0NTgwNn0.MVJN-4wU7_cnPPPlX8IVcxDVG3CoPqPHmTebHGbMCVM';

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      supabaseUrl: SUPABASE_URL,
      supabaseKey: SUPABASE_KEY,
      emailjsService:   process.env.EMAILJS_SERVICE    || process.env.EMAILJS_SERVICE_ID || '',
      emailjsTemplate:  process.env.EMAILJS_TEMPLATE   || process.env.EMAILJS_TEMPLATE_ID || 'template_k8nldjn',
      emailjsPublicKey: process.env.EMAILJS_PUBLIC_KEY || '6Pw2b7AuVmU5pA3br',
      adminPhone:       process.env.ADMIN_PHONE         || '23058289431',
    }),
  };
};
