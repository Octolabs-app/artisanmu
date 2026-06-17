# Artizan Moris QA + Security Audit Handoff

Date: 2026-06-17
Repo: `github.com/Octolabs-app/artisanmu`
Production branch: `main`
Production URL: `https://artisanmu.octolabs.app`
Supabase project ref: `tlvgcxshiapqswcyyvyq`

This handoff captures an independent QA and security/code audit of Artizan Moris
(formerly ArtisanMU), a Mauritius home-services marketplace.

## Operating Rules For The Next Agent

- Read `AGENTS.md` first.
- Read `HANDOFF_PROMPT.md` for historical context, but note that this file is
  the Claude-specific QA handoff requested after that older prompt was written.
- Do not deploy unless explicitly asked.
- Do not push directly to `main` unless explicitly asked; `main` is production.
- Use a feature branch for fixes.
- Do not create real auth accounts during QA unless the founder explicitly asks.
- Do not type real passwords into login or admin forms.
- Keep the app static-export friendly.
- Do not add `src/app/api` route handlers.
- Privileged writes must continue going through Supabase Edge Functions.
- Do not commit secrets or print secret values in logs.

## Current Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind v4
- `output: "export"` static export
- Supabase Edge Functions backend
- Capacitor Android wrapper
- Vercel static frontend deployment

## Audit Baseline

The audited local copy was reset to the current remote production branch before
testing:

```text
git fetch origin
git checkout main
git reset --hard origin/main
```

Audited HEAD:

```text
bf079cd chore(android): set app display name to "Artizan Moris"
```

No production deploy was run during the audit.

## Build Health

`npm ci` passed, but reported vulnerabilities:

```text
added 471 packages, and audited 472 packages in 1m

156 packages are looking for funding
  run `npm fund` for details.

4 high severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```

`npm run lint` passed:

```text
> artisanmu-next@0.1.0 lint
> eslint
```

`npm run build` passed:

```text
> artisanmu-next@0.1.0 build
> next build

▲ Next.js 16.2.7 (Turbopack)

  Creating an optimized production build ...
✓ Compiled successfully in 6.3s
  Running TypeScript ...
  Finished TypeScript in 9.0s ...
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (0/12) ...
  Generating static pages using 11 workers (3/12)
  Generating static pages using 11 workers (6/12)
  Generating static pages using 11 workers (9/12)
✓ Generating static pages using 11 workers (12/12) in 900ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /admin
├ ○ /artisan
├ ○ /browse
├ ○ /how-it-works
├ ○ /login
├ ○ /ops
├ ○ /post
└ ○ /sitemap.xml

○  (Static)  prerendered as static content
```

`npm audit --audit-level=moderate` failed:

```text
# npm audit report

esbuild  0.17.0 - 0.28.0
Severity: high
esbuild: Missing binary integrity verification in Deno module enables remote code execution via NPM_CONFIG_REGISTRY - https://github.com/advisories/GHSA-gv7w-rqvm-qjhr
esbuild allows arbitrary file read when running the development server on Windows - https://github.com/advisories/GHSA-g7r4-m6w7-qqqr
fix available via `npm audit fix --force`
Will install wrangler@3.6.0, which is a breaking change
node_modules/esbuild
  wrangler  <=0.0.0-kickoff-demo || >=3.7.0
  Depends on vulnerable versions of esbuild
  Depends on vulnerable versions of miniflare
  node_modules/wrangler

ws  8.0.0 - 8.20.1
Severity: high
ws: Memory exhaustion DoS from tiny fragments and data chunks - https://github.com/advisories/GHSA-96hv-2xvq-fx4p
fix available via `npm audit fix --force`
Will install wrangler@3.6.0, which is a breaking change
node_modules/ws
  miniflare  <=0.0.0-fff677e35 || >=3.20250204.0
  Depends on vulnerable versions of ws
  node_modules/miniflare

4 high severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force
```

`npm run android:sync` passed:

```text
> artisanmu-next@0.1.0 android:sync
> npm run build && cap sync android

√ Copying web assets from out to android\app\src\main\assets\public in 176.28ms
√ Creating capacitor.config.json in android\app\src\main\assets in 2.41ms
√ copy android in 232.11ms
√ Updating Android plugins in 14.50ms
√ update android in 258.18ms
[info] Sync finished in 0.561s
```

## P0 Launch Blocker

### P0: Hard-coded fallback admin hash ships in source and built client bundle

Files:

- `src/components/admin-access-gate.tsx`
- `supabase/functions/_shared/artisanmu.ts`
- generated `out/_next/static/chunks/...`

Repro:

1. Build with missing or blank admin env.
2. Grep the generated `out/` directory for admin hash / admin gate strings.
3. The fallback admin hash is present in a client-side JavaScript chunk.
4. `/admin` performs a client-side SHA-256 comparison before showing the admin
   console.

Security impact:

- A password-derived admin verifier is bundled into public client code.
- If production env is missing or blank, the server fallback can become the
  effective admin credential verifier.
- This should block launch until removed.

One-line fix:

Remove the fallback hash entirely, require server-only `ADMIN_PASSWORD_HASH`, and
make admin access depend on server verification or Supabase Auth/admin allowlist
rather than a bundled client hash.

## P1 Should Fix

### P1: No rate limiting on public/admin Edge Functions

Files:

- `supabase/functions/_shared/artisanmu.ts`
- `supabase/functions/artisanmu-job-requests/index.ts`
- `supabase/functions/artisanmu-admin-artisans/index.ts`
- `supabase/functions/artisanmu-admin-jobs/index.ts`
- `supabase/functions/artisanmu-sign-upload/index.ts`

Repro:

- Repeated fake admin password POSTs return `403 admin_forbidden` each time with
  no throttle.
- Public job creation and upload-signing paths also have no abuse control.
- Shared CORS currently allows `Access-Control-Allow-Origin: *`.

One-line fix:

Add origin allowlisting and IP/user/action rate limits inside Edge Functions,
with stricter limits for admin auth attempts and upload/job creation.

### P1: Upload signer allows unauthenticated application upload URLs

File:

- `supabase/functions/artisanmu-sign-upload/index.ts`

Repro:

- The `purpose === "artisan-application"` path can mint upload paths without an
  authenticated session.
- The current registration UI uses an authenticated user function flow, so this
  unauthenticated branch is unnecessary exposure.

One-line fix:

Require Supabase Auth or a short-lived registration token for artisan
application uploads.

### P1: Static build can pass without public Supabase env

File:

- `next.config.ts`

Repro:

1. Build without required public Supabase env.
2. Build still passes.
3. Client features such as Browse/Login can ship without a usable Supabase URL
   or publishable key.

One-line fix:

Fail production builds when `NEXT_PUBLIC_SUPABASE_URL` or
`NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing.

### P1: `/post?trade=Painter` prefill is broken

Files:

- `src/components/post-job-view.tsx`
- `src/components/JobRequestForm.tsx`

Repro:

1. Directly open `/post?trade=Painter`.
2. The flow remains on the urgency step.
3. Clicking the Painter/Pintur trade pill manually does advance correctly.

One-line fix:

Derive `initialTrade` synchronously from search params before rendering the form,
or remount the form after the query param is resolved.

### P1: i18n coverage is incomplete

Files:

- `src/components/browse-artisans.tsx`
- `src/components/login-access-panel.tsx`
- `src/components/artisan-registration-form.tsx`
- likely also admin/artisan dashboard components

Repro:

- Switch to Morisien.
- Browse still shows English quick filters, select labels, `Reset`, and search
  aria-label.
- Login and Join-as-artisan form copy is English-only.

One-line fix:

Move these strings into the existing language copy map and wrap login/admin/
artisan-dashboard surfaces in the language context.

### P1: Approved artisan phone numbers are publicly exposed

Files:

- `src/lib/artisan-profile.ts`
- `src/components/browse-artisans.tsx`

Repro:

- Anonymous Supabase reads can return approved artisan `tel`.
- Browse builds direct `wa.me` links from this value.

Context:

- This might be a product decision, but it should be explicit because the rest
  of the app treats customer phone numbers as protected PII.

One-line fix:

Either document approved artisan phone numbers as intentionally public, or move
contact reveal behind a protected Edge Function.

### P1: High-severity dependency audit failures

Files:

- `package.json`
- `package-lock.json`

Repro:

- Run `npm audit --audit-level=moderate`.
- High severity advisories are reported for `esbuild` and `ws` via
  `wrangler`/`miniflare`.

One-line fix:

Update or replace the affected Wrangler/Miniflare dependency path carefully;
avoid blind `npm audit fix --force` unless the Cloudflare deployment path is
retested.

### P1: Android release config is not release-ready

Files:

- `capacitor.config.ts`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/build.gradle`
- `android/app/src/main/res/xml/file_paths.xml`

Verified good:

- appId is `app.octolabs.artisanmu`.
- app name is `Artizan Moris`.
- webDir is `out`.
- `npm run android:sync` passes.

Concerns:

- No release signing config was found.
- `allowBackup=true` should be reviewed for production privacy.
- Broad file provider paths should be narrowed or removed if unused.
- Icons should be verified visually before a signed release.

One-line fix:

Add release signing, review backup policy, narrow file provider access, and
verify production icons/splash assets.

## P2 Nice To Have

### P2: Focus indicators are too subtle

Files:

- `src/components/login-access-panel.tsx`
- `src/components/browse-artisans.tsx`
- `src/components/JobRequestForm.tsx`

Repro:

- Keyboard through forms and filters.
- Focus is often only a subtle border change.

One-line fix:

Add consistent `focus-visible:ring` styles to inputs, selects, buttons, and
links.

### P2: Header/app logo PNG is heavy

Files:

- `src/components/artisanmu-logo.tsx`
- `public/artizan-moris-logo.png`
- `public/artizan-moris-logo-192.png`

Repro:

- Main logo PNG is about 312 KB.

One-line fix:

Use the 192px asset for header/favicon contexts and reserve the larger asset for
social previews or install screens.

### P2: Social preview metadata is incomplete

File:

- `src/app/layout.tsx`

Repro:

- Metadata exists, but no dedicated Open Graph/Twitter image is configured.

One-line fix:

Add `openGraph.images` and Twitter card image metadata using an optimized
Artizan Moris preview asset.

### P2: External Unsplash images are unoptimized in static export

Files:

- `src/lib/mock-data.ts`
- `next.config.ts`

Repro:

- `images.unoptimized: true` is required for static export.
- Remote images are loaded directly from Unsplash at configured dimensions.

One-line fix:

Replace the repeated remote images with local compressed assets or smaller remote
dimensions.

### P2: Security headers can be stronger

File:

- `public/_headers`

Current good:

- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy

Gap:

- No Content-Security-Policy is currently defined.

One-line fix:

Add a CSP that allows the known Next static assets, Supabase endpoint, image
hosts, and analytics/ad hosts that the product actually uses.

## Positive Security Checks

- Admin Edge Functions verify the admin password server-side before privileged
  mutations.
- Invalid fake admin password smoke returned `403 admin_forbidden`.
- Admin job delete-photo uses the stored DB photo path, not a client-supplied
  arbitrary storage path.
- Job claim flow does not trust client-sent artisan IDs; it derives the artisan
  from the bearer token and approved artisan record.
- Job phone number is decrypted only after a successful claim.
- Live anon RLS probes showed pending/rejected artisans did not leak.
- Live anon RLS probes showed job requests returned `[]`.
- Live anon RLS probes showed job notifications returned permission denied.
- Sensitive artisan columns such as application email/auth user id were denied
  to anon reads.
- No Supabase service-role key was found in the generated `out/` directory.
- No `src/app/api` route handlers were found during this audit.

## Functional QA Notes

### Home

- Loads without console errors.
- Header/logo present.
- EN/FR/Morisien language switching works on marketing copy.
- Header logo subtitle remains English: `Mauritius home services`.

### Post Job

- Validation works for:
  - empty/short description
  - missing district
  - invalid Mauritius WhatsApp number
  - photo over size limit
- No real valid job was submitted during the audit.
- `/post?trade=Painter` prefill bug is listed as P1 above.

### Browse

- Approved artisans load from live Supabase when env is configured.
- No-match state works.
- Reset control works but label is hard-coded English.
- Quick filters and advanced select labels do not fully localize.

### Login / Join As Artisan

- Sign-in form loads.
- No password was typed during the audit.
- Join-as-artisan toggle works.
- Empty submit validation works.
- Form copy and validation are English-only.
- No account was created.

### Mobile 375px

Checked at 375px width:

- `/`
- `/browse`
- `/post`
- `/login`

Result:

- No horizontal overflow found.
- No browser console errors found in the tested flows.

## Suggested Parallel Fix Tracks

If multiple agents are available, split the work like this:

1. Security agent
   - Remove admin fallback hash.
   - Replace client-side admin gate with server/Auth-backed checks.
   - Add Edge Function rate limiting.
   - Tighten CORS.
   - Review upload signer auth.

2. Product QA/i18n agent
   - Fix `/post?trade=` prefill.
   - Finish Browse/Login/Admin/Artisan Dashboard localization.
   - Re-test marketing pages and mobile layout.

3. Platform/release agent
   - Add env validation for production builds.
   - Resolve or mitigate npm audit issues.
   - Harden Android release config.
   - Add CSP and social preview metadata.

4. Performance/design agent
   - Reduce logo/image weight.
   - Replace or optimize external Unsplash assets.
   - Improve keyboard focus styles.

## Recommended Launch Gate

Block launch until:

1. P0 admin fallback hash is removed from source and client bundles.
2. Admin access no longer depends on a client-side bundled hash.
3. Public/admin Edge Functions have abuse protection.
4. Production builds fail if required Supabase env is missing.
5. `npm audit --audit-level=moderate` is either clean or explicitly accepted
   with documented mitigation.

After fixes:

```text
npm ci
npm run lint
npm run build
npm audit --audit-level=moderate
npm run android:sync
```

Then run browser QA for:

- `/`
- `/how-it-works`
- `/browse`
- `/post`
- `/post?trade=Painter`
- `/login`
- `/artisan`
- `/admin`

Do not deploy until the founder explicitly approves deployment.
