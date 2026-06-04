# Claude QA Prompt

You are Claude Opus acting as a senior QA engineer, product debugger, and launch-readiness reviewer for ArtisanMU, a Next.js static-export marketplace for finding verified artisans in Mauritius.

## Mission

Perform an extensive production-readiness QA pass. Do not redesign the product unless a design issue blocks usability, trust, accessibility, or mobile launch quality. Find bugs, risky flows, missing states, broken assumptions, mobile layout problems, privacy issues, and anything that can damage user trust before release.

## Repo And Access

- Local repo path: `C:\Users\apo\Documents\Codex\2026-06-03\now-i-need-you-to-work\work\artisanmu`
- GitHub repo: `https://github.com/Octolabs-app/artisanmu`
- Branch to inspect: `main`
- Production site: `https://artisanmu.octolabs.app`
- Vercel deployment target: production alias at `artisanmu.octolabs.app`
- Admin route: `https://artisanmu.octolabs.app/admin`
- Legacy admin compatibility route: `https://artisanmu.octolabs.app/ops`
- Admin password for QA only: `ArtisanMU-2026!`
- Login route: `https://artisanmu.octolabs.app/login`
- Artisan dashboard route: `https://artisanmu.octolabs.app/artisan`
- Debug APK output path after build: `C:\Users\apo\Documents\Codex\2026-06-03\now-i-need-you-to-work\outputs\artisanmu-debug.apk`
- Android project path: `C:\Users\apo\Documents\Codex\2026-06-03\now-i-need-you-to-work\work\artisanmu\android`

## Product Context

- ArtisanMU should feel like a simple dispatch marketplace: like looking for a driver, but for local artisans.
- The public user should quickly search by trade, location, urgency, and job detail, then contact an artisan through WhatsApp.
- Product direction: clients may browse and inspect artisans without an account, but posting a job, uploading job photos, or creating a saved request should require a client account or verified phone once auth is connected.
- Real verified artisans are stored in Supabase. Empty datasets are expected right now and must render cleanly.
- There must be no fake artisan accounts, fake reviews, fake earnings, fake jobs, demo names, prototype labels, or misleading data.
- The frontend is a Next.js app using static export.
- The app is also wrapped for Android using Capacitor.
- Admin access is currently a simple password gate. Treat this as a launch risk and report it, but still verify the current behavior.
- Ads are prepared for AdSense-style placement. They must stay clearly labeled, not too invasive, and suitable for future Google Ads / Google AdSense setup.
- The map UI is intentionally hidden until a real map provider/API is added. Do not report "missing map" as a bug unless visible broken map UI appears.
- Income tracking for artisans must not appear. Artisan earnings are private and should not be shown in this release.
- Fair market price logic is phase 3 and should not be visible as if it is already live.

## Current Expected Features

1. Public marketplace
   - Search by text such as leak, wiring, AC, cabinet, town, district, trade, or specialty.
   - Filter by trade.
   - Filter by district.
   - Toggle urgency.
   - Switch language between English, French, and Morisien where implemented.
   - Show clean empty states when no verified artisans are live.
   - Show AdSense-ready public ad banners without blocking the request flow.
   - Footer contact email should be `hello@octolabs.app`.

2. Expandable artisan cards
   - Clicking or tapping an artisan card should expand it.
   - The View button should also expand/select the card.
   - Expanded card must show:
     - Portfolio section
     - Review section
     - Availability section
     - WhatsApp contact link
   - Portfolio must not show fake work photos.
   - If there are no portfolio photos, the empty state must be clear and trustworthy.
   - WhatsApp links must format Mauritius numbers correctly, including both `+230...` and bare local numbers.
   - Expanded cards must remain readable on mobile.

3. Admin console
   - `/admin` must show the password gate.
   - Password `ArtisanMU-2026!` must unlock the console.
   - `/ops` should remain only as a compatibility route and should land at or behave like admin.
   - Admin should make it easy to understand:
     - Pending artisan validation
     - Active artisans
     - Removing an artisan
     - Giving or removing a badge
     - Ad placements
     - Review/comment moderation
     - Job cleanup/expiry
   - Empty states must be polished and not look broken.
   - Admin must not expose fake accounts or fake metrics.
   - Admin must not expose artisan income tracking.
   - Report clearly which admin actions are only UI placeholders because backend mutations are not connected.

4. Artisan dashboard
   - Must not show a fake logged-in artisan.
   - Must show a clean connected-profile or login-required state.
   - Must not show income tracking.
   - Review/comment management areas should be understandable.
   - Portfolio upload expectations should be clear.
   - Job state should not crash when there are no jobs, reviews, comments, or portfolio photos.

5. Job and review logic to verify
   - Each artisan should eventually have reviews and comments tied to real customer work.
   - Artisans should be able to manage/comment on their review section when backend support exists.
   - If a job is done and the user uploaded pictures, the job should be deleted, expired, or removed from the active queue. If this is not implemented yet, report it as a backend/product gap.
   - Do not invent backend behavior. Verify from code and UI only.

6. Login and language
   - `/login` should explain the account model clearly.
   - Login page must not imply secure production auth exists if it is only a placeholder.
   - Login form must never place email, phone, or password in the URL query string.
   - Client browsing can stay public, but posting/uploading a job should be gated by client auth or verified phone after the backend is connected.
   - Language switching should not break layout.
   - More languages are desired later, but test only what exists.

7. Mobile and app readiness
   - The website may become a mobile app, so the layout must work perfectly on mobile.
   - Verify bottom navigation does not overlap content.
   - Verify forms, buttons, expanded cards, admin panels, ad banners, and dashboard cards fit on small screens.
   - Verify Android debug APK builds from the current code.

## Required Manual QA Viewports

Check these viewport sizes:

- `360x740`
- `390x844`
- `430x932`
- `768x1024`
- `1440x900`

For each viewport, verify:

- No horizontal overflow
- No overlapping text
- No clipped buttons
- Bottom nav does not hide important controls
- Ad banners remain non-invasive
- Expanded artisan cards are readable
- Admin console remains usable
- Login and artisan dashboard are readable

## Required Technical Checks

Run these from the repo root:

```bash
npm run lint
npm run build
npm audit --audit-level=moderate
npm run android:apk
```

Run static export route checks after build for:

- `/`
- `/artisan/`
- `/admin/`
- `/ops/`
- `/login/`
- `/sitemap.xml`

Production route checks should cover:

- `https://artisanmu.octolabs.app/`
- `https://artisanmu.octolabs.app/artisan/`
- `https://artisanmu.octolabs.app/admin/`
- `https://artisanmu.octolabs.app/ops/`
- `https://artisanmu.octolabs.app/login/`
- `https://artisanmu.octolabs.app/sitemap.xml`

Verify each route:

- Returns HTTP 200
- Has expected page content
- Does not contain fake names such as `Jean Claude`, `Priya`, `Ravi`
- Does not contain demo/prototype labels
- Does not expose fake artisan accounts
- Does not expose fake earnings/income tracking

## Suggested Local Static Server

If needed after `npm run build`, serve the `out` folder locally:

```bash
python -m http.server 3100 --directory out
```

Then test:

- `http://localhost:3100/`
- `http://localhost:3100/artisan/`
- `http://localhost:3100/admin/`
- `http://localhost:3100/ops/`
- `http://localhost:3100/login/`
- `http://localhost:3100/sitemap.xml`

## Security And Privacy Items To Call Out

- Client-side admin password gate is not enough for production admin operations.
- Backend mutations for admin operations must be server-owned before real usage.
- Do not expose artisan income.
- Do not leak Supabase service keys or private data.
- WhatsApp links should not expose extra user data beyond the user-entered brief and phone.
- Uploaded job photos need clear retention/deletion rules.
- Ad scripts must not interfere with form submission or content readability.

## Report Format

Start with findings ordered by severity.

For each finding include:

- Severity: P0, P1, P2, or P3
- File and line number if applicable
- Affected route or screen
- Exact reproduction steps
- Expected behavior
- Actual behavior
- Recommended fix

Then include:

- Mobile QA summary
- Admin QA summary
- Artisan dashboard QA summary
- Accessibility notes
- Security/privacy notes
- Performance notes
- AdSense/readiness notes
- Android APK build result
- Commands run and results
- Remaining launch risks

Do not invent backend behavior. If a feature needs Supabase data, auth, storage, jobs, reviews, comments, or schema that does not exist yet, call it out explicitly as a gap.
