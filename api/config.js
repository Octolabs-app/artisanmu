const { setCors } = require('./_utils');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || process.env.SUPABASE_API_URL || 'https://tlvgcxshiapqswcyyvyq.supabase.co',
    supabaseKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsdmdjeHNoaWFwcXN3Y3l5dnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNjk4MDYsImV4cCI6MjA5NTk0NTgwNn0.MVJN-4wU7_cnPPPlX8IVcxDVG3CoPqPHmTebHGbMCVM',
    emailjsService:   process.env.EMAILJS_SERVICE    || '',
    emailjsTemplate:  process.env.EMAILJS_TEMPLATE   || process.env.EMAILJS_TEMPLATE_ID || 'template_k8nldjn',
    emailjsPublicKey: process.env.EMAILJS_PUBLIC_KEY || '6Pw2b7AuVmU5pA3br',
    adminPhone:       process.env.ADMIN_PHONE         || '23058289431',
  });
};
