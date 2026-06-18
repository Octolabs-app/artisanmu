# Artizan Moris

Next.js rebuild of the Artizan Moris marketplace. The frontend is a static export;
privileged job workflows run through Supabase Edge Functions.

## Getting Started

Run the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in the browser.

## Production Build

```bash
npm run lint
npm run build
npm audit --audit-level=moderate
```

The app uses static export. Cloudflare Pages or Vercel can deploy the generated
`out` directory.

## Pages

The public site is split into routed pages (shared header tabs + footer):

- `/` — landing (hero, how-it-works teaser, popular trades, CTA)
- `/how-it-works` — steps, why Artizan Moris, FAQ
- `/browse` — verified artisans with live Supabase data + filters
- `/post` — the job-request flow (accepts `?trade=` to preselect a trade)

`/login`, `/artisan`, `/admin` (and the `/ops` redirect) keep their own layouts.
Language (EN / FR / Morisien) is shared across pages via a context provider and
persisted in `localStorage`.

## Advertising

Ad placements use one reusable responsive banner component. Without Google AdSense
environment variables, the component renders nothing (no placeholder box).

```bash
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-...
NEXT_PUBLIC_ADSENSE_SEARCH_SLOT=...
NEXT_PUBLIC_ADSENSE_REQUEST_SLOT=...
NEXT_PUBLIC_ADSENSE_ARTISAN_SLOT=...
```

The visible label is `Advertisements`, placements are separated from navigation
and primary actions, and the component uses responsive `data-ad-format` plus
`data-full-width-responsive="true"` for Google-style display units.

## Cloudflare Pages

```bash
npm run deploy:cloudflare
```

This requires `CLOUDFLARE_API_TOKEN` in non-interactive environments.

## Supabase Edge Functions

Supabase Edge Functions power the production job request flow:

```bash
artisanmu-sign-upload   # public, validates image metadata and returns a signed Storage upload token
artisanmu-job-requests  # public, creates a protected job request and targeted artisan notifications
artisanmu-claim-job     # authenticated, derives the artisan from the Supabase session before contact reveal
```

The static app calls those functions with the public Supabase URL and publishable
key. Server-only secrets stay inside Supabase Functions; hosted functions receive
the project service role/secret key from Supabase by default.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<public Supabase publishable key>
```

Keep service-role and contact encryption secrets out of `NEXT_PUBLIC_*`
variables. Browser clients never write directly to the core Supabase tables. Job
notifications are targeted to verified artisans with a linked `auth_user_id`;
artisans can only read their own notification rows via RLS. Supabase signed
upload URLs currently use the platform's fixed upload-token lifetime, so the app
validates file type/size before issuing one. The artisan login page is
client-side, so the `NEXT_PUBLIC_SUPABASE_*` values must exist at build time.

## Next Build Notes

This repo uses Next.js 16 with static export. Do not add `src/app/api` route
handlers unless static export is intentionally removed. Use Supabase Edge
Functions for server-owned writes.

## Next Product Work

See `HANDOFF_PROMPT.md` for the next-chat prompt and remaining production tasks.

## License

Artizan Moris is proprietary software. See `LICENSE` for usage terms. Third-party
dependencies remain subject to their own license terms.

## Android APK

The Android wrapper uses Capacitor and bundles the static `out` export.

```bash
npm run android:apk
```

The debug APK is generated at:

```bash
android/app/build/outputs/apk/debug/app-debug.apk
```

Create a signed release build before Play Store or public distribution.

## Map

The previous illustrative Mauritius map is intentionally removed from the public UI.
Add a real provider before showing map controls again.

Recommended future env shape:

```bash
NEXT_PUBLIC_MAP_PROVIDER=mapbox
NEXT_PUBLIC_MAP_PUBLIC_TOKEN=...
```
