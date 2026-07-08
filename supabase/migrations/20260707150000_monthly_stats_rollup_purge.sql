-- Self-maintaining data lifecycle (applied to prod via MCP on 2026-07-07):
-- resolved job requests (completed / claimed / expired) are rolled up into
-- monthly analytics and then purged from the live tables. Only aggregate
-- numbers are kept long-term; personal job data disappears automatically.

create table if not exists public.monthly_stats (
  month date primary key,
  jobs_posted integer not null default 0,
  jobs_claimed integer not null default 0,
  jobs_completed integer not null default 0,
  jobs_expired integer not null default 0,
  leads_sent integer not null default 0,
  contacts_revealed integer not null default 0,
  by_trade jsonb not null default '{}'::jsonb,
  by_district jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Service-role only (deny-all RLS, same posture as audit_logs/job_events).
alter table public.monthly_stats enable row level security;

create or replace function public.artizan_job_maintenance()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Tunable retention windows before a resolved job is rolled up + purged.
  purge_completed_after constant interval := interval '48 hours';
  purge_claimed_after   constant interval := interval '7 days';
  purge_expired_after   constant interval := interval '7 days';
  job record;
  bucket date;
  lead_count integer;
  reveal_count integer;
begin
  -- 1. Open jobs past their deadline become 'expired'.
  update job_requests
     set status = 'expired'
   where status = 'open'
     and expires_at < now();

  -- 2. Leads whose job is no longer open/claimed are expired too.
  update job_notifications n
     set status = 'expired'
   where n.status in ('pending', 'read')
     and exists (
       select 1 from job_requests j
        where j.id = n.job_id
          and j.status not in ('open', 'claimed')
     );

  -- 3. Roll up then purge resolved jobs. Aggregation happens exactly once per
  --    job because the job row is deleted in the same pass (job_events and
  --    job_notifications cascade away with it).
  for job in
    select id, status, category, district, created_at
      from job_requests
     where (status = 'completed' and coalesce(claimed_at, created_at) < now() - purge_completed_after)
        or (status = 'claimed'   and claimed_at is not null and claimed_at < now() - purge_claimed_after)
        or (status = 'expired'   and expires_at < now() - purge_expired_after)
  loop
    bucket := date_trunc('month', job.created_at)::date;

    -- leads_sent = how many artisans were notified for this job
    select coalesce(sum(coalesce((metadata->>'targeted_artisan_count')::integer, 0)), 0)
      into lead_count
      from job_events where job_id = job.id and event = 'created';
    select count(*) into reveal_count from job_events where job_id = job.id and event = 'contact_revealed';

    insert into monthly_stats as ms (month, jobs_posted, jobs_claimed, jobs_completed, jobs_expired,
                                     leads_sent, contacts_revealed, by_trade, by_district, updated_at)
    values (
      bucket,
      1,
      case when job.status in ('claimed', 'completed') then 1 else 0 end,
      case when job.status = 'completed' then 1 else 0 end,
      case when job.status = 'expired' then 1 else 0 end,
      lead_count,
      reveal_count,
      jsonb_build_object(job.category, 1),
      jsonb_build_object(job.district, 1),
      now()
    )
    on conflict (month) do update set
      jobs_posted       = ms.jobs_posted + 1,
      jobs_claimed      = ms.jobs_claimed + (case when job.status in ('claimed', 'completed') then 1 else 0 end),
      jobs_completed    = ms.jobs_completed + (case when job.status = 'completed' then 1 else 0 end),
      jobs_expired      = ms.jobs_expired + (case when job.status = 'expired' then 1 else 0 end),
      leads_sent        = ms.leads_sent + lead_count,
      contacts_revealed = ms.contacts_revealed + reveal_count,
      by_trade          = jsonb_set(ms.by_trade, array[job.category],
                            to_jsonb(coalesce((ms.by_trade->>job.category)::integer, 0) + 1)),
      by_district       = jsonb_set(ms.by_district, array[job.district],
                            to_jsonb(coalesce((ms.by_district->>job.district)::integer, 0) + 1)),
      updated_at        = now();

    delete from job_requests where id = job.id;
  end loop;
end;
$$;

-- Cron schedule is unchanged: 'artizan-job-maintenance' every 15 minutes.

-- Only the cron (postgres role) may run the maintenance function — API roles
-- must not be able to trigger it via PostgREST RPC (advisor 0028/0029).
revoke execute on function public.artizan_job_maintenance() from public;
revoke execute on function public.artizan_job_maintenance() from anon;
revoke execute on function public.artizan_job_maintenance() from authenticated;
