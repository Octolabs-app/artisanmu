# Backend Security Workstream

Claude Opus is not available in this workspace, so Codex owns this workstream too. Do not rewrite the current Next.js screens unless a backend contract requires a small prop/API adjustment. Own the Supabase security, schema, and automation plan.

## Objective

Make ArtisanMu safe to run by itself:

- public users can create job requests
- verified artisans can manage only their own dashboard data
- Octolabs ops can approve artisans, grant badges, and manage ad placements
- stale jobs, reminders, and review prompts run automatically
- all sensitive actions have audit trails

## Current Context

- Existing Supabase project has `artisans`, `job_requests`, `invoices`, `invoice_items`, and `products`.
- Current RLS/grants are too broad: anon has unsafe access on several tables.
- Storage buckets are public and upload/delete policies need review.
- The new local frontend has:
  - `/` marketplace search
  - `/artisan` artisan dashboard prototype
  - `/ops` discreet ops console prototype

## Deliverables

1. Supabase migration plan
   - Create or adjust tables:
     - `admin_users`
     - `artisan_profiles`
     - `artisan_badges`
     - `ad_placements`
     - `job_events`
     - `audit_logs`
   - Keep compatibility with existing `artisans` and `job_requests` where possible.

2. RLS and grants
   - anon: read verified public artisan profiles and create job requests only through safe paths.
   - authenticated artisan: read/update own profile, own availability, own claimed jobs.
   - admin/service role: approve artisans, grant badges, manage ads, review jobs.
   - revoke broad anon update/delete privileges.
   - do not use user-editable metadata for authorization.

3. Server-owned mutation layer
   - Next Route Handlers or Supabase Edge Functions for:
     - `create_job_request`
     - `claim_job_request`
     - `approve_artisan`
     - `grant_artisan_badge`
     - `save_ad_placement`
     - `mark_job_done`
   - Service role key must stay server-only.

4. Automation
   - Expire stale unclaimed jobs.
   - Rotate matching artisans.
   - Send reminder events.
   - Queue review prompts after completed jobs.
   - Log every automation decision in `job_events` or `audit_logs`.

5. Storage safety
   - Signed upload path for job photos and portfolio images.
   - Restrict delete/update to owner or admin.
   - Keep public read only for approved portfolio assets.

6. Verification
   - Provide SQL tests or MCP queries proving:
     - anon cannot update artisans, ads, badges, products, invoices
     - artisan cannot update another artisan
     - admin mutation works through server path
     - public search still reads verified profiles

## Output Format

- Migration SQL files or exact SQL blocks.
- A short threat model.
- A route/function contract document for the frontend.
- Test evidence for every policy group.
