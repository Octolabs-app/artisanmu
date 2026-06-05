begin;

alter table public.artisans
  add column if not exists application_email text,
  add column if not exists verification_status text not null default 'pending',
  add column if not exists reviewed_at timestamptz,
  add column if not exists verification_notes text,
  add column if not exists has_fast_response_badge boolean not null default false,
  add column if not exists has_top_rated_badge boolean not null default false;

update public.artisans
set verification_status = 'approved'
where is_verified = true
  and verification_status <> 'approved';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'artisans_verification_status_check'
  ) then
    alter table public.artisans
      add constraint artisans_verification_status_check
      check (verification_status in ('pending', 'approved', 'rejected', 'removed'));
  end if;
end $$;

create index if not exists artisans_verification_status_created_idx
  on public.artisans (verification_status, created_at desc);

create index if not exists artisans_application_email_idx
  on public.artisans (lower(application_email))
  where application_email is not null;

grant select (
  has_fast_response_badge,
  has_top_rated_badge
) on public.artisans to anon;

grant select (
  verification_status,
  application_email,
  reviewed_at,
  verification_notes,
  has_fast_response_badge,
  has_top_rated_badge
) on public.artisans to authenticated;

drop policy if exists "Authenticated artisan can update own profile basics" on public.artisans;

create policy "Verified artisan can update own profile basics"
  on public.artisans
  for update
  to authenticated
  using (
    auth_user_id = (select auth.uid())
    and is_verified = true
    and verification_status = 'approved'
  )
  with check (
    auth_user_id = (select auth.uid())
    and is_verified = true
    and verification_status = 'approved'
  );

drop policy if exists "Anyone can upload to portfolios" on storage.objects;
drop policy if exists "Owner can delete from portfolios" on storage.objects;
drop policy if exists "Public read portfolios" on storage.objects;

commit;
