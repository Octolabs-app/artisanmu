const { createClient } = require('@supabase/supabase-js');
const { setCors, SUPABASE_URL, SUPABASE_KEY } = require('../_utils');

function calcTotals(items, vatRate) {
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = Math.round(parseFloat(item.unit_price) || 0);
    return sum + Math.round(qty * price);
  }, 0);
  const vat = Math.round(subtotal * (parseFloat(vatRate) || 0) / 100);
  return { subtotal_cents: subtotal, vat_cents: vat, total_cents: subtotal + vat };
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // GET — list invoices for an artisan
  if (req.method === 'GET') {
    const { artisan_id } = req.query;
    if (!artisan_id) return res.status(400).json({ error: 'artisan_id required' });
    const { data, error } = await supabase
      .from('invoices')
      .select('id,invoice_number,client_name,total_cents,status,issue_date,due_date,created_at')
      .eq('artisan_id', artisan_id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  // POST — create invoice with server-side total calculation
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const {
      artisan_id, job_request_id,
      client_name, client_whatsapp, client_address,
      due_date, vat_rate, payment_notes, notes,
      items = [],
    } = body;

    if (!artisan_id || !client_name) {
      return res.status(400).json({ error: 'artisan_id and client_name are required' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one line item is required' });
    }

    // Auto-generate invoice number: INV-YYYY-NNN (per artisan, resets each year)
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('artisan_id', artisan_id)
      .gte('created_at', `${year}-01-01`);
    const seq = String((count || 0) + 1).padStart(3, '0');
    const invoice_number = `INV-${year}-${seq}`;

    const { subtotal_cents, vat_cents, total_cents } = calcTotals(items, vat_rate || 0);

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert([{
        invoice_number,
        artisan_id,
        job_request_id: job_request_id || null,
        client_name,
        client_whatsapp: client_whatsapp || null,
        client_address: client_address || null,
        due_date: due_date || null,
        subtotal_cents,
        vat_rate: parseFloat(vat_rate) || 0,
        vat_cents,
        total_cents,
        payment_notes: payment_notes || null,
        notes: notes || null,
        status: ['draft','sent'].includes(body.status) ? body.status : 'draft',
      }])
      .select()
      .single();

    if (invErr) return res.status(500).json({ error: invErr.message });

    // Insert line items
    const itemRows = items.map((item, i) => {
      const qty = parseFloat(item.quantity) || 1;
      const price = Math.round(parseFloat(item.unit_price) || 0);
      return {
        invoice_id: invoice.id,
        description: String(item.description || '').substring(0, 200),
        quantity: qty,
        unit: item.unit || null,
        unit_price: price,
        total: Math.round(qty * price),
        sort_order: i,
      };
    });

    const { error: itemsErr } = await supabase.from('invoice_items').insert(itemRows);
    if (itemsErr) {
      // Roll back invoice if items fail
      await supabase.from('invoices').delete().eq('id', invoice.id);
      return res.status(500).json({ error: itemsErr.message });
    }

    return res.status(201).json({ ...invoice, items: itemRows });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
