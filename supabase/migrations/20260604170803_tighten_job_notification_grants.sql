begin;

revoke all on public.job_notifications from anon, authenticated;

grant select on public.job_notifications to authenticated;
grant update (status, read_at, claimed_at) on public.job_notifications to authenticated;
grant select, insert, update, delete on public.job_notifications to service_role;

commit;
