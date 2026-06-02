const { createClient } = require('@supabase/supabase-js');
const { setCors, SUPABASE_URL, SUPABASE_KEY } = require('../_utils');

function calcTotals(items, vatRate) {
  const subtotal = items.reduce((sum, item) => {
    return sum + Math.round((parseFloat(item.quantity) || 0) * (Math.round(parseFloat(item.unit_price) || 0)));
  }, 0);
  const vat = Math.round(subtotal * (parseFloat(vatRate) || 0) / 100);
  return { subtotal_cents: subtotal, vat_cents: vat, total_cents: subtotal + vat };
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing invoice id' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // GET — fetch invoice + items (public for non-draft)
  if (req.method === 'GET') {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Draft invoices require artisan_id query param to view
    if (invoice.status === 'draft') {
      const { artisan_id } = req.query;
      if (!artisan_id || artisan_id !== invoice.artisan_id) {
        return res.status(403).json({ error: 'Draft invoice — artisan only' });
      }
    }

    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('sort_order');

    // Fetch artisan name + trade for display
    const { data: artisan } = await supabase
      .from('artisans')
      .select('nom,metier,ville,district,tel,is_verified')
      .eq('id', invoice.artisan_id)
      .single();

    return res.status(200).json({ ...invoice, items: items || [], artisan: artisan || null });
  }

  // PATCH — update invoice (artisan only, identified by artisan_id in body)
  if (req.method === 'PATCH') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const { artisan_id, items, ...fields } = body;
    if (!artisan_id) return res.status(400).json({ error: 'artisan_id required' });

    // Verify ownership
    const { data: existing } = await supabase
      .from('invoices').select('artisan_id,status').eq('id', id).single();
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });
    if (existing.artisan_id !== artisan_id) return res.status(403).json({ error: 'Not your invoice' });

    const updatePayload = { ...fields, updated_at: new Date().toISOString() };

    // Recalculate totals if items provided
    if (Array.isArray(items) && items.length > 0) {
      const vatRate = fields.vat_rate ?? existing.vat_rate ?? 0;
      const { subtotal_cents, vat_cents, total_cents } = calcTotals(items, vatRate);
      Object.assign(updatePayload, { subtotal_cents, vat_cents, total_cents });

      // Replace all items
      await supabase.from('invoice_items').delete().eq('invoice_id', id);
      const itemRows = items.map((item, i) => ({
        invoice_id: id,
        description: String(item.description || '').substring(0, 200),
        quantity: parseFloat(item.quantity) || 1,
        unit: item.unit || null,
        unit_price: Math.round(parseFloat(item.unit_price) || 0),
        total: Math.round((parseFloat(item.quantity) || 1) * Math.round(parseFloat(item.unit_price) || 0)),
        sort_order: i,
      }));
      await supabase.from('invoice_items').insert(itemRows);
    }

    const { data, error } = await supabase
      .from('invoices').update(updatePayload).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // DELETE — only drafts
  if (req.method === 'DELETE') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const { artisan_id } = body || req.query;

    const { data: existing } = await supabase
      .from('invoices').select('artisan_id,status').eq('id', id).single();
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.artisan_id !== artisan_id) return res.status(403).json({ error: 'Not your invoice' });
    if (existing.status !== 'draft') return res.status(400).json({ error: 'Only drafts can be deleted' });

    await supabase.from('invoices').delete().eq('id', id);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
