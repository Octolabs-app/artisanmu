# Artizan Moris Audit - 2026-06-18

Scope: security and quality pass for the Next.js 16 static export frontend and Supabase project `tlvgcxshiapqswcyyvyq`. Live Supabase metadata was inspected through MCP; no production data rows were changed.

## Executive Summary

The app is still aligned with the intended static-export architecture: no `src/app/api` routes, no request-time Next server APIs, and privileged writes stay in Supabase Edge Functions. RLS is enabled on every public table, and local frontend env files only expose public Supabase values.

The main launch blockers are Edge Function hardening and storage policy cleanup. Existing browser-invoked functions still use wildcard CORS, several functions accept public traffic without an app-level abuse guard, and the live `job-photos` storage policy currently allows anon upload/read even though uploads are meant to flow through signed tokens.

## Findings

### High - Wildcard CORS on Edge Functions

Evidence: `supabase/functions/_shared/artisanmu.ts` and standalone functions `artisanmu-submit-review`, `artisanmu-set-avatar`, and `artisanmu-set-contact-preference` set `Access-Control-Allow-Origin: *`.

Risk: any website can send browser requests to public Artizan Moris functions. Function auth still matters, but wildcard CORS increases abuse surface for job posting, registration, review posting, and admin password attempts.

Fix: introduce a new shared CORS helper for future/non-core functions and migrate non-crypto functions after founder approval. Use an allowlist from an Edge Function secret such as `ARTIZAN_ALLOWED_ORIGINS=https://artizanmoris.octolabs.app,https://artisanmu.octolabs.app,http://localhost:3000,http://127.0.0.1:3000`. Echo the matching origin, return `Vary: Origin`, allow no origin only for server-to-server or same-originless smoke tests, and keep `OPTIONS` fast.

Do not edit `supabase/functions/_shared/artisanmu.ts` or redeploy `artisanmu-claim-job`, `artisanmu-job-requests`, or `artisanmu-sign-upload` in this lane.

### High - `job-photos` Storage Policy Bypasses Signed Upload Intent

Evidence: live storage metadata shows bucket `job-photos` is private, but `storage.objects` policies allow anon `INSERT` and anon `SELECT` for `bucket_id = 'job-photos'`.

Risk: public clients can upload and read job photos without going through `artisanmu-sign-upload`; this weakens file validation, cleanup, and contact-photo privacy assumptions.

Fix: founder-approved Supabase migration to remove anon read/upload policies for `job-photos`, keep bucket private, and rely on signed upload/download paths from Edge Functions. Before rollout, smoke test job posting with photo upload and artisan/admin photo visibility.

### High - No App-Level Rate Limit Guard on Public Functions

Evidence: public functions are active with `verify_jwt=false`: `artisanmu-sign-upload`, `artisanmu-job-requests`, `artisanmu-register-artisan`, `artisanmu-admin-artisans`, `artisanmu-admin-jobs`, `artisanmu-submit-review`, and the in-progress `artisanmu-admin-content`. Current Supabase hosted rate limit only covers recursive Edge Function calls, not inbound public traffic.

Risk: brute-force admin password attempts, spam job requests, registration abuse, and review spam.

Fix: add a lightweight guard to new/non-core functions using a small Postgres table such as `edge_rate_limits(bucket text primary key, count int, reset_at timestamptz)`. Bucket by action + coarse IP hash + user id when available; return `429` with `Retry-After`. Suggested first limits: admin auth 10/min/IP, job requests 8/hour/IP, registration 5/hour/IP, reviews 10/hour/IP/artisan. Keep crypto-critical core unchanged until a dedicated hardening window.

### Medium - Broad SQL Grants Increase Blast Radius

Evidence: live grants show broad anon/authenticated privileges on several public tables (`audit_logs`, `job_requests`, `messages`, `job_events`, `reviews`, `products`, invoice tables). RLS is enabled and current policies restrict many row paths, but the grants are broader than the actual browser model needs.

Risk: a future permissive RLS policy or security-definer mistake could expose writes/reads immediately.

Fix: add a tightening migration that revokes unused direct privileges from `anon`/`authenticated`, then grants only the operations required by real client-side reads. Keep service-role grants for Edge Functions.

### Medium - Public Artisan Profiles Include Sensitive Columns

Evidence: public `artisans` policy exposes approved artisans to anon/authenticated clients. The table includes `nic`, `application_email`, `contact_preference`, and `photos`; browse UI only needs public profile fields.

Risk: even if the UI does not select every column, direct Data API access can select any column allowed by RLS on approved artisan rows.

Fix: move private application fields out of the public profile table or expose browse data through a restricted view/RPC with `security_invoker = true`; revoke direct public select once the frontend is moved.

### Medium - Public Review Read Policy Is Unfiltered

Evidence: `reviews_public_read` policy has `qual: true` for anon/authenticated.

Risk: future moderation fields or hidden reviews would become public unless every query filters carefully.

Fix: add a `status`/`is_visible` predicate to the public read policy before expanding review moderation.

### Medium - Leaked Password Protection Still Needs Founder/Dashboard Action

Evidence: prior Supabase advisor handoff flagged leaked-password protection disabled. Current MCP database access does not expose the Auth dashboard toggle directly.

Risk: users can choose known compromised passwords.

Fix: founder enables Auth password leaked-password protection in Supabase dashboard. Supabase documents this as a Pro-plan feature using HaveIBeenPwned password checks.

### Low - Legacy Brand Assets Were Still Tracked

Evidence: `public/artisanmu-logo.svg` and `public/artisanmu-mark.svg` were tracked and unreferenced.

Fix: removed in this audit branch.

### Low - User-Facing `ArtisanMu` Copy Remains in Locked Dashboard Surface

Evidence: `src/components/artisan-dashboard.tsx` still contains user-facing `ArtisanMu` strings, but this file is currently owned by another agent per the brief.

Fix: hand off to the dashboard agent during the i18n/dashboard polish pass. This branch fixed the safe browser-visible fallback messages in `src/lib/artisanmu-functions.ts`.

### Low - `src/lib/admin-data.ts` Is an Empty Stub Module

Evidence: the module exports empty arrays. It is still imported by `src/components/artisan-dashboard.tsx`, which is locked in this lane.

Risk: confusing dead-data path and blank review/comment states.

Fix: remove after the dashboard agent replaces those imports with live data or localized empty states.

## Quality Notes

- No service-role, admin password, or secret env var names were present in `.env.local` or `.env.example`; only public Supabase config appeared locally.
- No `src/app/api` route handlers or Next request-time server APIs were found in `src`.
- README old product naming was corrected in this branch; deeper domain/deploy docs can follow the founder's DNS switch.
- Bundle size: clean static export produced `out/` at about 2.0 MB across 109 files; `_next/static` was about 1.2 MB across 26 files. Largest assets were `artizan-moris-logo.png` at about 312 KB and JS chunks at about 224 KB, 222 KB, 146 KB, and 110 KB.

## Verification

- `npm run lint` passed in a clean audit worktree.
- `ALLOW_MISSING_SUPABASE=true npm run build` passed in a clean audit worktree; the app prerendered all routes as static content.
- The active shared checkout currently has unrelated in-progress `src/components/admin-console.tsx` changes from another agent. A direct build in that dirty checkout failed because `ReviewCard` now requires `onView` at one call site. This audit slice was verified in a clean worktree to avoid touching the locked admin modal work.

## Recommended PR Slices

1. Safe cleanup: old-brand asset removal, browser-visible brand copy, audit report. No deploy side effects.
2. Sponsor banner: first-party sponsor config and placement component, independent of AdSense.
3. i18n/a11y: `/login` and artisan registration first; dashboard/admin after the locked files settle.
4. Supabase hardening: CORS allowlist + rate-limit helper for non-core functions, then storage policy tightening with founder approval and full smoke tests.
