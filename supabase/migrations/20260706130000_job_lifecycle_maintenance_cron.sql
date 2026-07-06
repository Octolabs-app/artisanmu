-- Automated job lifecycle upkeep (applied to prod via MCP on 2026-07-06):
-- every 15 min, expire past-deadline open jobs, expire their stale leads, and
-- prune jobs resolved (expired/completed) more than 30 days ago. Deleting a job
-- cascades to job_notifications and job_events.
create extension if not exists pg_cron;

create or replace function public.artizan_job_maintenance()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update job_requests
     set status = 'expired'
   where status = 'open'
     and expires_at < now();

  update job_notifications n
     set status = 'expired'
   where n.status in ('pending', 'read')
     and exists (
       select 1 from job_requests j
        where j.id = n.job_id
          and j.status not in ('open', 'claimed')
     );

  delete from job_requests
   where status in ('expired', 'completed')
     and coalesce(claimed_at, expires_at, created_at) < now() - interval '30 days';
end;
$$;

do $$
begin
  perform cron.unschedule('artizan-job-maintenance');
exception when others then
  null;
end $$;

select cron.schedule('artizan-job-maintenance', '*/15 * * * *', $$select public.artizan_job_maintenance()$$);
