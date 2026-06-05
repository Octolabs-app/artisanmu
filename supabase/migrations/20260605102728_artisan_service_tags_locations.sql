begin;

alter table public.artisans
  add column if not exists service_tags text[] not null default '{}'::text[];

update public.artisans
set service_tags = '{}'::text[]
where service_tags is null;

update public.artisans
set district = case
  when district in ('Curepipe', 'Quatre Bornes', 'Rose Hill', 'Vacoas', 'Phoenix', 'Beau Bassin') then 'Plaines Wilhems'
  when district in ('Mahebourg', 'Mahébourg') then 'Grand Port'
  when district = 'Grand Baie' then 'Riviere du Rempart'
  when district = 'Souillac' then 'Savanne'
  when district in ('Port Mathurin', 'Rodrigues') then 'Rodrigues'
  else district
end
where district in (
  'Curepipe',
  'Quatre Bornes',
  'Rose Hill',
  'Vacoas',
  'Phoenix',
  'Beau Bassin',
  'Mahebourg',
  'Mahébourg',
  'Grand Baie',
  'Souillac',
  'Port Mathurin',
  'Rodrigues'
);

create index if not exists artisans_service_tags_gin_idx
  on public.artisans using gin (service_tags);

create index if not exists artisans_public_approved_created_idx
  on public.artisans (created_at desc)
  where is_verified = true
    and verification_status = 'approved';

grant select (
  service_tags,
  verification_status
) on public.artisans to anon;

grant select (
  service_tags
) on public.artisans to authenticated;

drop policy if exists "Public read verified artisans" on public.artisans;

create policy "Public read approved artisans"
  on public.artisans
  for select
  to anon, authenticated
  using (
    is_verified = true
    and verification_status = 'approved'
  );

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  )
  and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'artisans'
  ) then
    alter publication supabase_realtime add table public.artisans;
  end if;
exception
  when duplicate_object then
    null;
end $$;

commit;
