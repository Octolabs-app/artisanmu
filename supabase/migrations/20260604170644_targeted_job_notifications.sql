begin;

create table if not exists public.job_notifications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_requests(id) on delete cascade,
  artisan_id bigint not null references public.artisans(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'read', 'claimed', 'dismissed', 'expired')),
  urgency text not null default 'planned'
    check (urgency in ('urgent', 'planned')),
  match_reason jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  claimed_at timestamptz,
  unique (job_id, artisan_id)
);

create index if not exists job_notifications_auth_status_created_idx
  on public.job_notifications (auth_user_id, status, created_at desc);

create index if not exists job_notifications_job_status_idx
  on public.job_notifications (job_id, status);

create index if not exists artisans_target_match_idx
  on public.artisans (is_verified, district, ville, metier)
  where auth_user_id is not null;

alter table public.job_notifications enable row level security;

revoke all on public.job_notifications from anon, authenticated;

grant select on public.job_notifications to authenticated;
grant update (status, read_at, claimed_at) on public.job_notifications to authenticated;
grant select, insert, update, delete on public.job_notifications to service_role;

drop policy if exists "Artisans can read own job notifications" on public.job_notifications;
drop policy if exists "Artisans can update own job notifications" on public.job_notifications;

create policy "Artisans can read own job notifications"
  on public.job_notifications
  for select
  to authenticated
  using (auth_user_id = (select auth.uid()));

create policy "Artisans can update own job notifications"
  on public.job_notifications
  for update
  to authenticated
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

drop policy if exists "Verified district artisans can read open requests" on public.job_requests;
drop policy if exists "Targeted artisans can read assigned requests" on public.job_requests;

create policy "Targeted artisans can read assigned requests"
  on public.job_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.job_notifications notification
      where notification.job_id = job_requests.id
        and notification.auth_user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.artisans artisan
      where artisan.auth_user_id = (select auth.uid())
        and artisan.id = job_requests.claimed_by_artisan_id
    )
  );

commit;
