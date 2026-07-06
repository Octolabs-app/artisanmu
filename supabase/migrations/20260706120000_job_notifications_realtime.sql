-- Realtime lead alerts: stream INSERTs/UPDATEs on job_notifications to the
-- artisan dashboard. RLS already scopes reads to auth_user_id = auth.uid().
-- (Applied to production via MCP on 2026-07-06.)
alter publication supabase_realtime add table public.job_notifications;
