begin;

alter table public.artisans
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists artisans_auth_user_id_idx
  on public.artisans (auth_user_id)
  where auth_user_id is not null;

drop policy if exists "Authenticated artisans can read open requests" on public.job_requests;
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
      where artisan.auth_user_id = auth.uid()
        and artisan.is_verified = true
        and (
          artisan.district = job_requests.district
          or artisan.ville = job_requests.district
        )
    )
  );

commit;
