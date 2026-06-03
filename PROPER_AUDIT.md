# ArtisanMu Proper Audit

Date: 2026-06-03
Scope: local Next.js rebuild, live Supabase posture, admin/artisan/public workflows.

## Executive Summary

ArtisanMu should not launch with browser-side writes to the current Supabase tables. The UI can move forward locally, but production release needs a backend hardening sprint first.

The new local prototype now reflects the intended product:

- Public users search, use the map, submit one request, and optionally upload photos.
- Artisans manage availability, jobs, profile quality, reviews, and comments.
- Ops manages artisan validation, removals, badges, reviews/comments, ad links/embeds, and job cleanup.
- Income tracking is removed from the artisan dashboard for phase 1.
- Fair market pricing is deferred to phase 3.

## Critical Backend Findings

### RLS and Grants

Supabase advisors report multiple `RLS Policy Always True` warnings:

- `public.artisans`: unrestricted anon insert and update.
- `public.job_requests`: unrestricted anon insert.
- `public.products`: unrestricted anon manage policy.
- `public.invoices`: unrestricted anon manage policy.
- `public.invoice_items`: unrestricted anon manage policy.

Manual grant inspection also shows anon/authenticated roles have broad `DELETE`, `INSERT`, `UPDATE`, `TRUNCATE`, `TRIGGER`, and `REFERENCES` privileges on core public tables.

Impact:

- A public browser client can alter artisans, invoices, products, and job data.
- Any admin UI connected directly to these policies would be unsafe.
- Artisan removal, badge grants, ad placements, review hiding, and job cleanup must be server-owned.

Sources:

- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Next.js Auth guidance: https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs

### Storage

Supabase advisors report public bucket listing for:

- `job-photos`
- `portfolios`

Current storage policies allow anon upload to both buckets and anon delete from portfolios.

Impact:

- Job photos may expose private client home photos.
- Public listing can leak file names and uploaded content.
- Completed jobs with uploaded pictures need a cleanup workflow.

### Auth

Supabase advisor reports leaked password protection disabled.

The login UI should remain a standard email/password form compatible with password managers. Production auth should use Supabase Auth with server-side session handling.

Source:

- OWASP Authentication Cheat Sheet: https://owasp.deteact.com/cheat/cheatsheets/Authentication_Cheat_Sheet.html

### Automation

There are no Supabase Edge Functions currently deployed.

Missing automation:

- expire stale requests
- rotate matching artisans
- send review prompts
- clean up completed photo jobs
- log admin actions
- notify ops about abuse/flags

## UI/Product Audit

### Public Marketplace

Current improvements:

- Search-first layout retained.
- Language selector added: English, French, Mauritian Creole.
- Interactive Mauritius district map added.
- Request form includes job details, WhatsApp, and photo upload.
- Login route added.

Remaining release tasks:

- Wire request creation through a server route.
- Use signed upload URLs for job photos.
- Add true location/distance matching after backend supports coordinates.
- Add empty states for districts with no verified artisans.

### Ops Console

Current improvements:

- Ops remains discreet at `/ops`.
- Artisan approval queue exists.
- Active artisan management added with remove/restore UI.
- Review moderation added with hide/show UI.
- Comment thread management added.
- Ad placements support native card, banner link, and embed code formats.
- Job cleanup queue added for completed jobs with uploaded photos.

Remaining release tasks:

- Require admin login before `/ops`.
- All ops actions must call server-owned mutations.
- Add audit logs for every approve/remove/badge/ad/review/delete action.
- Add confirmation modals for destructive actions.

### Artisan Dashboard

Current improvements:

- Income/money tracking removed.
- The former Money tab is now Reviews.
- Job cards no longer display earnings or private income.
- Review and comment management added.
- Availability toggle retained.

Phase decision:

- Phase 1: no income tracking, no fair-price analytics.
- Phase 2: job quality and review workflow.
- Phase 3: fair market price guidance, shown as benchmarking rather than artisan income tracking.

### Ads

Ads should be labelled and placed natively in the flow. Google Ad Manager describes native ads as publisher-styled elements and requires visible attribution such as "Ad", "Advertisement", or "Sponsored".

Implementation direction:

- Support sponsored link placements first.
- Support embed snippets only after sanitization and allowlisting.
- Do not allow arbitrary script embeds in the browser admin form.
- Preview every ad before publishing.
- Keep ads away from primary request/accept buttons.

Sources:

- Google native ad elements: https://support.google.com/admanager/answer/6366845
- Google AdSense placement policies: https://support.google.com/adsense/answer/1346295

## Required Backend Contract

Server routes or Edge Functions:

- `POST /api/job-requests`
- `POST /api/job-photos/sign-upload`
- `POST /api/artisans/approve`
- `POST /api/artisans/remove`
- `POST /api/artisans/badge`
- `POST /api/reviews/moderate`
- `POST /api/comments/moderate`
- `POST /api/ad-placements`
- `POST /api/jobs/cleanup-completed-photo-job`

Tables to add:

- `admin_users`
- `artisan_accounts`
- `artisan_badges`
- `reviews`
- `comments`
- `ad_placements`
- `job_events`
- `audit_logs`

Required data retention:

- Job photos are private by default.
- Completed photo jobs should be deleted or anonymized after confirmation.
- Keep minimal audit logs without storing private photos.

## Release Gate

Do not deploy the rebuild over the live site until:

- broad anon grants are revoked
- permissive RLS policies are replaced
- storage uploads use signed URLs
- `/ops` is protected
- service role key is server-only
- job cleanup automation exists
- destructive ops actions have audit logs and confirmations

## Verification Done Locally

- Lint/build completed before this audit pass.
- Mobile route checks previously passed for `/`, `/artisan`, `/ops`.
- New post-audit UI changes still require final lint/build/browser verification before validation.
