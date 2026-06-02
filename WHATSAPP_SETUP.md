# WhatsApp Business API Setup for ArtisanMU

## What this gives you
Invoices are delivered directly to clients' WhatsApp — no manual forwarding, no tapping Send.
The message arrives FROM a dedicated ArtisanMU number.

Free tier: **1,000 conversations / month** (plenty for Mauritius scale at launch).

---

## Step 1 — Create a Meta Developer App (15 min)

1. Go to https://developers.facebook.com/apps
2. Click **Create App** → choose **Business** → give it the name "ArtisanMU"
3. On the app dashboard, click **Add Product** → find **WhatsApp** → click **Set Up**
4. You'll be dropped into the WhatsApp Quickstart page

---

## Step 2 — Get your credentials

On the **WhatsApp > API Setup** page you'll see:

| Field | Where to find it |
|-------|-----------------|
| **Phone Number ID** | Listed under "Step 1: Select a phone number" — looks like `123456789012345` |
| **Temporary Access Token** | Shown at the top of the page — valid for 24h for testing |
| **Permanent Token** | System User token (see Step 2b below) |

### Step 2b — Create a permanent token

1. Go to **Business Settings** (business.facebook.com)
2. **System Users** → Add → name it "artisanmu-api", role: Admin
3. **Add Assets** → add your WhatsApp App → give Full Control
4. **Generate Token** → select your app → check `whatsapp_business_messaging` permission
5. Copy the token — it never expires

---

## Step 3 — Register the message template

WhatsApp requires pre-approved templates for business-initiated messages (artisan → client).

1. In your Meta App → **WhatsApp > Message Templates**
2. Click **Create Template**
3. Fill in:
   - **Category**: Utility
   - **Name**: `artisanmu_invoice`  ← must match exactly
   - **Language**: French
   - **Body**:
     ```
     Bonjour {{1}} 👋

     *{{2}}* vous a envoyé une facture via ArtisanMU.

     📄 Facture : {{3}}
     💰 Montant : {{4}}
     📅 Échéance : {{5}}

     Voir et imprimer votre facture :
     ```
   - **Button**: Add Button → type **Visit Website**
     - Button text: `Voir la facture`
     - URL: `https://artisanmu.vercel.app/#invoice/` (Vercel will append the invoice ID)
     - URL type: **Dynamic**

4. Submit for review → Meta usually approves utility templates within **24–48 hours**

---

## Step 4 — Add credentials to Vercel

In your Vercel dashboard → ArtisanMU project → **Settings > Environment Variables**, add:

| Name | Value |
|------|-------|
| `WHATSAPP_TOKEN` | Your permanent system user token |
| `WHATSAPP_PHONE_ID` | Your phone number ID |
| `WHATSAPP_TEMPLATE` | `artisanmu_invoice` |
| `APP_BASE_URL` | `https://artisanmu.vercel.app` (or your custom domain) |

Then **Redeploy** (Deployments tab → click the latest → Redeploy).

---

## Step 5 — Test it

1. On Meta App → WhatsApp → API Setup → add your personal number to "Test recipients" (up to 5 numbers, instant, no template needed)
2. In ArtisanMU admin, open any invoice → click **📲 Envoyer via WhatsApp API**
3. You should receive the message on your phone within seconds

---

## Production: register your real phone number

The test phone number Meta gives you is temporary. To use your real business number:

1. WhatsApp > Phone Numbers → **Add Phone Number**
2. Enter a real number that is NOT already on WhatsApp personal or WhatsApp Business App
3. Verify with an OTP
4. You can use a Mauritius virtual number from a VoIP provider if you don't want to tie up a personal SIM

> **Tip**: If your current number is on WhatsApp personal, buy a cheap extra SIM or use a VoIP number (e.g. from telecloud.mu or SMS-MU). Costs ~Rs 50/month.

---

## Cost summary

| Volume | Cost |
|--------|------|
| First 1,000 conversations/month | **Free** |
| Beyond that | ~$0.0236 per conversation (USD) |
| At 2,000 invoices/month | ~$23/month |

A "conversation" = all messages to one number within 24 hours.
One invoice send = one conversation = one billing unit.
