begin;

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

drop policy if exists "Verified district artisans can read open requests" on public.job_requests;

create policy "Verified district artisans can read open requests"
  on public.job_requests
  for select
  to authenticated
  using (
    status = 'open'
    and expires_at > now()
    and exists (
      select 1
      from public.artisans artisan
      where artisan.auth_user_id = (select auth.uid())
        and artisan.is_verified = true
        and (
          artisan.district = job_requests.district
          or artisan.ville = job_requests.district
        )
    )
  );

commit;
