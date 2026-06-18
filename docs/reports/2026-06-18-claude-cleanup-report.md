# Claude Cleanup Report - Artizan Moris - 2026-06-18

Claude, this repo is `Octolabs-app/artisanmu`, local checkout `C:\Users\apo\Projects\artisanmu-octolabs`, branch `apcod/artizan-audit-safe-fixes`.

## What Was Cleaned

- Removed generated Next output: `.next/` and `out/`.
- Removed generated Android/Capacitor output:
  - `android/.gradle/`
  - `android/build/`
  - `android/app/build/`
  - `android/app/src/main/assets/`
  - `android/app/src/main/res/xml/config.xml`
  - `android/capacitor-cordova-android-plugins/`
- Removed generated `next-env.d.ts`.
- This also cleared stale generated Android assets that still contained old-brand files `artisanmu-logo.svg` and `artisanmu-mark.svg`.

These files are reproducible from `npm run build`, `npx cap sync android`, or Android/Gradle builds. They should not be committed.

## What Was Intentionally Left Alone

- `.env.local` was not removed. It is local environment configuration and should stay out of git.
- `node_modules/` was not removed. It is local dependency state and is ignored.
- `supabase/functions/artisanmu-admin-content/` was not removed. It is untracked in this checkout but belongs to the active admin content/detail-modal workstream.
- `supabase/functions/artisanmu-open-jobs/` was not removed. It is untracked in this checkout but belongs to the active artisan open-jobs workstream.
- `src/components/admin-console.tsx` was not touched in this cleanup pass because it contains active in-progress admin modal changes from another agent.

## Current Git State After Cleanup

Expected remaining dirty state:

```text
 M src/components/admin-console.tsx
?? supabase/functions/artisanmu-admin-content/
?? supabase/functions/artisanmu-open-jobs/
```

The cleanup itself mostly removed ignored/generated files, so the only new tracked work from this pass is this committed report.

## Existing Audit Commit

Latest committed cleanup/audit slice:

```text
687caba chore: add Artizan Moris audit cleanup
```

That commit:

- Added `docs/audits/2026-06-18-artizan-moris-audit.md`.
- Removed tracked old-brand SVGs from `public/`.
- Fixed browser-visible fallback copy from `ArtisanMu` to `Artizan Moris`.
- Updated README public-facing product naming.

Clean verification for that audit commit passed:

```text
npm run lint
ALLOW_MISSING_SUPABASE=true npm run build
```

## Build Caveat

A direct build of the shared checkout is currently blocked by the in-progress `src/components/admin-console.tsx` changes. The specific TypeScript issue observed earlier was that `ReviewCard` now requires an `onView` prop at one call site. Do not resolve this by reverting unrelated admin-console work; coordinate with the admin modal workstream or finish that call-site wiring in the same feature slice.

## Repo Guardrails

- Keep the app static-export friendly: no `src/app/api` route handlers.
- Privileged writes belong in Supabase Edge Functions.
- Do not edit `supabase/functions/_shared/artisanmu.ts` or redeploy crypto-critical core functions without an explicit hardening task.
- User-facing brand is `Artizan Moris`; code slugs may remain `artisanmu-*`.
- Before pushing to `main`, run `npm run lint` and `npm run build` in the actual final working tree.
