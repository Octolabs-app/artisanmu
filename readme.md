# ArtisanMu

Next.js rebuild of the ArtisanMu marketplace for Cloudflare Pages.

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

The app uses static export. Cloudflare Pages should deploy the generated `out` directory.

## Advertising

Ad placements use one reusable responsive banner component. Without Google AdSense
environment variables, the UI shows a clearly labeled direct-partner fallback.

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

Cloudflare Pages Functions power the server-only job request APIs:

```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>
CONTACT_ENCRYPTION_KEY=<long random secret, 16+ chars>
CONTACT_HASH_SALT=<optional separate random salt>
```

Keep `SUPABASE_SERVICE_ROLE_KEY` and `CONTACT_ENCRYPTION_KEY` out of
`NEXT_PUBLIC_*` variables. The public form calls `/api/job-requests` and
`/api/job-photos/sign-upload`; browser clients never write directly to the core
Supabase tables. Supabase signed upload URLs currently use the platform's fixed
upload-token lifetime, so the app validates file type/size before issuing one.

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
