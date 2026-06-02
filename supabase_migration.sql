-- ============================================================
-- ArtisanMU — Full Migration
-- Run this in your Supabase SQL Editor (sypwtcndehuroudbnzdw)
-- ============================================================

-- 1. Extend artisans table
ALTER TABLE artisans
  ADD COLUMN IF NOT EXISTS contact_preference TEXT NOT NULL DEFAULT 'whatsapp'
    CHECK (contact_preference IN ('call','whatsapp','form')),
  ADD COLUMN IF NOT EXISTS is_available_today BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS callout_fee INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_rates JSONB,
  ADD COLUMN IF NOT EXISTS has_fair_price_badge BOOLEAN NOT NULL DEFAULT false;

-- 2. Job requests table
CREATE TABLE IF NOT EXISTS job_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category              TEXT NOT NULL,
  description           TEXT NOT NULL,
  image_url             TEXT,
  budget_tier           TEXT NOT NULL DEFAULT 'mid'
                          CHECK (budget_tier IN ('low','mid','high')),
  district              TEXT NOT NULL,
  town                  TEXT,
  client_name           TEXT NOT NULL,
  client_whatsapp       TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','claimed','resolved','expired')),
  claimed_by_artisan_id UUID REFERENCES artisans(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  claim_timeout_at      TIMESTAMPTZ,
  expires_at            TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- 3. Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number   TEXT NOT NULL,
  artisan_id       UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  job_request_id   UUID REFERENCES job_requests(id) ON DELETE SET NULL,
  client_name      TEXT NOT NULL,
  client_whatsapp  TEXT,
  client_address   TEXT,
  issue_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date         DATE,
  subtotal_cents   INTEGER NOT NULL DEFAULT 0,
  vat_rate         NUMERIC(5,2) NOT NULL DEFAULT 0,
  vat_cents        INTEGER NOT NULL DEFAULT 0,
  total_cents      INTEGER NOT NULL DEFAULT 0,
  payment_notes    TEXT,
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','sent','paid','overdue')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  quantity     NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit         TEXT,
  unit_price   INTEGER NOT NULL DEFAULT 0,
  total        INTEGER NOT NULL DEFAULT 0,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

-- 5. Products / showcase table
CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id  UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  price       INTEGER,
  image_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. RLS policies (enable if not already on)
ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products     ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT a job request (clients don't need accounts)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='job_requests' AND policyname='anon_insert_jobs') THEN
    CREATE POLICY anon_insert_jobs ON job_requests FOR INSERT TO anon WITH CHECK (true);
  END IF;
END $$;

-- Anyone can read pending jobs (artisans browse feed without auth)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='job_requests' AND policyname='anon_read_pending') THEN
    CREATE POLICY anon_read_pending ON job_requests FOR SELECT TO anon USING (status = 'pending');
  END IF;
END $$;

-- Anyone can update a pending job to claimed (artisan claims it)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='job_requests' AND policyname='anon_claim_job') THEN
    CREATE POLICY anon_claim_job ON job_requests FOR UPDATE TO anon
      USING (status = 'pending') WITH CHECK (status = 'claimed');
  END IF;
END $$;

-- Public can view non-draft invoices by their UUID (client receives link)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='invoices' AND policyname='public_read_sent_invoices') THEN
    CREATE POLICY public_read_sent_invoices ON invoices FOR SELECT TO anon
      USING (status IN ('sent','paid','overdue'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='invoice_items' AND policyname='public_read_items') THEN
    CREATE POLICY public_read_items ON invoice_items FOR SELECT TO anon
      USING (EXISTS (
        SELECT 1 FROM invoices i
        WHERE i.id = invoice_items.invoice_id
          AND i.status IN ('sent','paid','overdue')
      ));
  END IF;
END $$;

-- Products public read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='products' AND policyname='public_read_products') THEN
    CREATE POLICY public_read_products ON products FOR SELECT TO anon USING (is_active = true);
  END IF;
END $$;
