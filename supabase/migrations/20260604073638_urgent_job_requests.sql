begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-photos',
  'job-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.job_requests
  add column if not exists urgency text not null default 'planned',
  add column if not exists claimed_at timestamptz,
  add column if not exists customer_display_name text not null default 'Client',
  add column if not exists whatsapp_hash text,
  add column if not exists whatsapp_encrypted text,
  add column if not exists whatsapp_iv text,
  add column if not exists photo_storage_path text,
  add column if not exists contact_revealed_at timestamptz;

update public.job_requests
set status = 'open'
where status = 'pending';

update public.job_requests
set status = 'completed'
where status = 'resolved';

alter table public.job_requests
  alter column status set default 'open',
  alter column expires_at set default (now() + interval '72 hours');

alter table public.job_requests
  drop constraint if exists job_requests_status_check,
  drop constraint if exists job_requests_urgency_check;

alter table public.job_requests
  add constraint job_requests_status_check
    check (status in ('open', 'claimed', 'completed', 'expired')),
  add constraint job_requests_urgency_check
    check (urgency in ('urgent', 'planned'));

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  job_request_id uuid not null references public.job_requests(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer', 'artisan')),
  sender_id text,
  body text not null,
  sent_at timestamptz not null default now()
);

create table if not exists public.job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_requests(id) on delete cascade,
  event text not null,
  artisan_id bigint references public.artisans(id) on delete set null,
  "timestamp" timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.job_requests(id) on delete set null,
  artisan_id bigint references public.artisans(id) on delete set null,
  event text not null,
  "timestamp" timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists job_requests_open_lookup_idx
  on public.job_requests (status, urgency, district, expires_at);

create index if not exists job_requests_claimed_by_idx
  on public.job_requests (claimed_by_artisan_id, status);

create index if not exists messages_job_request_time_idx
  on public.messages (job_request_id, sent_at);

create index if not exists job_events_job_time_idx
  on public.job_events (job_id, "timestamp");

create index if not exists audit_logs_job_time_idx
  on public.audit_logs (job_id, "timestamp");

alter table public.messages enable row level security;
alter table public.job_events enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Anyone can register" on public.artisans;
drop policy if exists "Artisan can update own profile" on public.artisans;

drop policy if exists "Anyone can post a job" on public.job_requests;
drop policy if exists "Anyone can resolve own job" on public.job_requests;
drop policy if exists "Artisan can claim pending job" on public.job_requests;
drop policy if exists "Public can read pending jobs" on public.job_requests;

drop policy if exists "Artisan can manage invoice items" on public.invoice_items;
drop policy if exists "Artisan can manage own invoices" on public.invoices;
drop policy if exists "Artisan can manage own products" on public.products;

create policy "Authenticated artisans can read open requests"
  on public.job_requests
  for select
  to authenticated
  using (status = 'open' and expires_at > now());

grant usage on schema public to service_role;
grant select on public.artisans to service_role;
grant select, insert, update, delete on public.job_requests to service_role;
grant select, insert, update, delete on public.messages to service_role;
grant select, insert, update, delete on public.job_events to service_role;
grant select, insert, update, delete on public.audit_logs to service_role;

commit;
