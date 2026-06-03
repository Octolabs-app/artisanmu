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

## Cloudflare Pages

```bash
npm run deploy:cloudflare
```

This requires `CLOUDFLARE_API_TOKEN` in non-interactive environments.

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
