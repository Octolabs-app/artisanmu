/**
 * POST /api/invoices/:id/send-whatsapp
 *
 * Sends an invoice notification to the client via Meta WhatsApp Cloud API.
 * Falls back gracefully if credentials are not configured.
 *
 * Required env vars:
 *   WHATSAPP_TOKEN       — permanent access token from Meta
 *   WHATSAPP_PHONE_ID    — phone number ID from Meta App dashboard
 *   WHATSAPP_TEMPLATE    — approved template name (default: "artisanmu_invoice")
 *   APP_BASE_URL         — public app URL (e.g. https://artisanmu.vercel.app)
 */
const { createClient } = require('@supabase/supabase-js');
const { setCors, SUPABASE_URL, SUPABASE_KEY } = require('../../_utils');

const WA_TOKEN    = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WA_TEMPLATE = process.env.WHATSAPP_TEMPLATE || 'artisanmu_invoice';
const BASE_URL    = process.env.APP_BASE_URL       || 'https://artisanmu.vercel.app';

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method Not Allowed' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing invoice id' });

  // Check WhatsApp is configured
  if (!WA_TOKEN || !WA_PHONE_ID) {
    return res.status(503).json({
      error: 'whatsapp_not_configured',
      message: 'WHATSAPP_TOKEN and WHATSAPP_PHONE_ID env vars are not set.',
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Verify artisan owns this invoice
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { artisan_id } = body || {};
  if (!artisan_id) return res.status(400).json({ error: 'artisan_id required' });

  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select('*, artisan:artisan_id(nom, metier, tel)')
    .eq('id', id)
    .single();

  if (invErr || !invoice) return res.status(404).json({ error: 'Invoice not found' });
  if (String(invoice.artisan_id) !== String(artisan_id))
    return res.status(403).json({ error: 'Not your invoice' });
  if (!invoice.client_whatsapp)
    return res.status(400).json({ error: 'No client WhatsApp number on this invoice' });

  // Normalise number — strip spaces/dashes, ensure country code
  let toNumber = invoice.client_whatsapp.replace(/[\s\-\(\)]/g, '');
  if (!toNumber.startsWith('+') && !toNumber.startsWith('230')) {
    toNumber = '230' + toNumber; // assume Mauritius if no country code
  }
  toNumber = toNumber.replace(/^\+/, ''); // Meta API wants digits only

  const invoiceUrl = `${BASE_URL}/#invoice/${id}`;
  const artisanName = invoice.artisan?.nom || 'Votre artisan';
  const artisanTrade = invoice.artisan?.metier || '';
  const totalFmt = 'Rs ' + ((invoice.total_cents || 0)).toLocaleString();
  const dueFmt = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  // Build WhatsApp template message
  // Template "artisanmu_invoice" must be approved in Meta App → WhatsApp → Message Templates
  // Parameters match the template variable order {{1}}, {{2}}, {{3}}, {{4}}, {{5}}
  const templateComponents = [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: invoice.client_name },          // {{1}} client name
        { type: 'text', text: artisanName + (artisanTrade ? ' (' + artisanTrade + ')' : '') }, // {{2}} artisan
        { type: 'text', text: invoice.invoice_number },       // {{3}} invoice number
        { type: 'text', text: totalFmt },                     // {{4}} total
        { type: 'text', text: dueFmt || '—' },                // {{5}} due date
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: id }], // appended to template URL suffix
    },
  ];

  const payload = {
    messaging_product: 'whatsapp',
    to: toNumber,
    type: 'template',
    template: {
      name: WA_TEMPLATE,
      language: { code: 'fr' },
      components: templateComponents,
    },
  };

  try {
    const waRes = await fetch(
      `https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WA_TOKEN}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const waData = await waRes.json();

    if (!waRes.ok) {
      console.error('[wa-invoice] Meta API error:', JSON.stringify(waData));
      return res.status(502).json({
        error: 'whatsapp_api_error',
        meta_error: waData?.error?.message || 'Unknown Meta error',
        code: waData?.error?.code,
      });
    }

    // Mark invoice as sent if it was a draft
    if (invoice.status === 'draft') {
      await supabase.from('invoices')
        .update({ status: 'sent', updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    return res.status(200).json({
      success: true,
      message_id: waData.messages?.[0]?.id,
      to: toNumber,
      invoice_url: invoiceUrl,
    });

  } catch (err) {
    console.error('[wa-invoice] fetch error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
