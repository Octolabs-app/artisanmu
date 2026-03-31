# ArtsianMU — Netlify Deployment Guide

## Required Environment Variables

Set these in your Netlify dashboard:
**Site configuration → Environment variables → Add a variable**

After adding all variables, trigger a **new deploy** (they don't apply retroactively).

---

### Supabase (required — app won't start without these)

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Your project URL, e.g. `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Your project's `anon` / `public` key |

Find both in: Supabase dashboard → Project Settings → API

---

### Admin authentication (required)

| Variable | Value |
|---|---|
| `ADMIN_PASSWORD_HASH` | SHA-256 hex hash of your chosen admin password |
| `SESSION_SECRET` | Any long random string (min 32 chars) used to sign tokens |

**How to generate ADMIN_PASSWORD_HASH:**

Open your browser DevTools console and run:
```js
const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('YourPasswordHere'));
console.log(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join(''));
```
Copy the output and paste it as the value of `ADMIN_PASSWORD_HASH`.

**How to generate SESSION_SECRET:**

Run in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Or use any password manager to generate a 64-character random string.

---

### EmailJS (optional — only needed for email notifications)

| Variable | Value |
|---|---|
| `EMAILJS_SERVICE` | Your EmailJS service ID |
| `EMAILJS_TEMPLATE` | Your EmailJS template ID |
| `EMAILJS_PUBLIC_KEY` | Your EmailJS public key |

---

### Other (optional)

| Variable | Value |
|---|---|
| `ADMIN_PHONE` | Admin WhatsApp number (default: `23058289431`) |

---

## What Changed from the Original

1. **No hardcoded credentials** — `index.html` no longer has Supabase keys baked in as a fallback.
2. **Stateless admin tokens** — replaced in-memory `Set` with HMAC-signed tokens that work correctly across all serverless function instances.
3. **Clear error messages** — missing env vars now surface a descriptive error instead of a silent crash.
4. **Shared `token-utils.js`** — all auth logic is in one place.
5. **Safer storage cleanup** — `admin-delete.js` uses proper URL parsing and won't block deletion if storage cleanup fails.

## Netlify Build Settings

No changes needed to `netlify.toml`. Build settings:
- **Publish directory:** `.`
- **Build command:** *(empty)*
- **Functions directory:** `netlify/functions`
