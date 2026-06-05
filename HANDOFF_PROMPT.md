# ArtisanMU Handoff Prompt

Use this prompt to continue in a fresh Codex chat. This work stays with Codex;
do not route it to Claude or another assistant.

```text
You are continuing work on ArtisanMU in:
C:\Users\apo\Documents\Codex\2026-06-03\now-i-need-you-to-work\work\artisanmu

Repo:
- GitHub: https://github.com/Octolabs-app/artisanmu
- Branch: main
- Production frontend: https://artisanmu.octolabs.app
- Supabase project ref: tlvgcxshiapqswcyyvyq
- Next.js 16 static export; read AGENTS.md and relevant node_modules/next/dist/docs before editing Next code.
- Supabase Edge Functions are the production backend. Do not reintroduce Vercel /api or Cloudflare Pages Functions unless the static-export architecture changes.

Current production state:
- Contact email is hello@octolabs.app.
- Admin route is /admin; /ops redirects for compatibility.
- Admin password hash fallback is in src/components/admin-access-gate.tsx.
- Artisan login works through Supabase Auth.
- Job posting uses Supabase Edge Functions:
  - artisanmu-sign-upload
  - artisanmu-job-requests
  - artisanmu-claim-job
- job_notifications table targets only verified artisans with auth_user_id.
- Artisan dashboard loads only the signed-in artisan's targeted notifications via RLS.
- Claiming a job derives artisan identity from the Supabase session and reveals WhatsApp only after claim.
- Ads are non-invasive and AdSense-ready through src/components/ad-banner.tsx.
- Map is intentionally hidden until a real map provider is added.

Verified QA from previous chat:
- npm run lint passed.
- npm run build passed.
- npm audit --audit-level=moderate passed.
- Created QA artisan account and verified full flow: post matching job -> notification for 1 artisan -> artisan login -> claim in UI -> WhatsApp button appears.
- Unauthorized claim without auth returned 401.
- Vercel production deploy succeeded and aliased to artisanmu.octolabs.app.
- Cloudflare deploy builds but needs CLOUDFLARE_API_TOKEN in the environment.

New requested work:
1. Replace "Request onboarding" with a real artisan self-registration flow.
   - Public artisan fills a form with name, email, password, WhatsApp, trade, district/town, bio, specialties, NIC/doc details as needed.
   - No manual email request.
   - The submission should create an auth user plus an unverified artisan profile.
   - Pending artisans must not receive job notifications until admin validates them.
   - Pending artisans should not access the full dashboard as verified artisans.

2. Wire admin validation to live Supabase data.
   - Admin dashboard should list pending artisan applications.
   - Admin can approve/reject/remove artisans.
   - Admin can grant badges.
   - Admin can manage ad placements.
   - Prefer Supabase Edge Functions with server-side admin password/hash verification for admin mutations.
   - Do not trust browser-sent artisan IDs for privileged mutations without server-side checks.

3. Add multiple portfolio images for artisans.
   - Artisan dashboard should allow uploading multiple images to showcase work.
   - Use Supabase signed upload tokens through an Edge Function.
   - Store paths/URLs in artisans.photos.
   - Keep file type and size validation.
   - Make mobile UI clean and app-ready.

4. Keep production hardening in mind.
   - Supabase advisors still noted:
     - leaked password protection disabled
     - portfolios public bucket listing policy
     - messages/job_events/audit_logs have RLS enabled with no user policies
   - Fix or document these before launch.

Before final:
- Run npm run lint
- Run npm run build
- Run npm audit --audit-level=moderate
- Test browser flow locally
- Deploy Edge Functions if changed
- Deploy frontend
- Push main to GitHub
```
