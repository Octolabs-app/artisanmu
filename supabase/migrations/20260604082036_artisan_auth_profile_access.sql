begin;

alter table public.artisans enable row level security;

revoke insert, update, delete on public.artisans from anon, authenticated;
revoke select on public.artisans from anon, authenticated;

grant select (
  id,
  nom,
  tel,
  metier,
  ville,
  district,
  lien,
  expertise,
  bio,
  avatar,
  photos,
  initiales,
  note_total,
  nombre_avis,
  is_verified,
  contact_preference,
  is_available_today,
  has_fair_price_badge,
  created_at
) on public.artisans to anon;

grant select (
  id,
  nom,
  tel,
  metier,
  ville,
  district,
  lien,
  gps,
  expertise,
  bio,
  avatar,
  photos,
  initiales,
  note_total,
  nombre_avis,
  is_verified,
  contact_preference,
  is_available_today,
  has_fair_price_badge,
  created_at,
  auth_user_id
) on public.artisans to authenticated;

grant update (
  is_available_today,
  contact_preference,
  bio,
  expertise,
  avatar,
  photos,
  lien,
  gps
) on public.artisans to authenticated;

drop policy if exists "Authenticated artisan can read own profile" on public.artisans;
drop policy if exists "Authenticated artisan can update own profile basics" on public.artisans;

create policy "Authenticated artisan can read own profile"
  on public.artisans
  for select
  to authenticated
  using (auth_user_id = (select auth.uid()));

create policy "Authenticated artisan can update own profile basics"
  on public.artisans
  for update
  to authenticated
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

commit;
