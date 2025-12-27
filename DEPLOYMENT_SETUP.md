# 🚀 Deployment Setup Guide

## Step-by-Step: Get All Your API Keys

---

## 1. ✅ Sentry (Error Tracking)

**You're on the Sentry setup page right now:**

1. **Project Name:** `earningsjr-web` (or `earningsjr-frontend`)
2. **Platform:** Choose **"Browser JavaScript"** or **"React"**
3. **Alert Frequency:** "Alert me on high priority issues" (default is fine)
4. **Click "Create Project"**

**After creation:**
- Copy the **DSN** (looks like: `https://xxx@xxx.ingest.sentry.io/xxx`)
- Save it: `VITE_SENTRY_DSN=your_dsn_here`

**For Backend (separate project):**
- Create another project: `earningsjr-api`
- Platform: **"Cloudflare Workers"**
- Copy the DSN for backend too

---

## 2. PostHog (Analytics)

1. Go to: https://posthog.com/signup
2. Sign up (free tier is generous)
3. Create new project: "EarningsJr"
4. Copy your **Project API Key** (looks like: `phc_xxxxx`)
5. Save it: `VITE_POSTHOG_KEY=phc_xxxxx`

**Note:** PostHog host is usually `https://app.posthog.com` (default)

---

## 3. Stripe (Payments)

1. Go to: https://dashboard.stripe.com/register
2. Sign up (free, only pay on transactions)
3. **Get Test Keys:**
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy **Publishable key** (starts with `pk_test_`)
   - Copy **Secret key** (starts with `sk_test_`)

4. **Create Products:**
   - Go to: https://dashboard.stripe.com/test/products
   - Click "Add product"
   - Name: "EarningsJr Premium Monthly"
   - Price: $9.99/month (recurring)
   - Copy the **Price ID** (starts with `price_`)
   - Repeat for Annual: $99/year → Copy Price ID

5. **Set up Webhook:**
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - URL: `https://api.earningsjr.com/stripe/webhook`
   - Events to send: Select all subscription events
   - Copy **Signing secret** (starts with `whsec_`)

**Save these:**
```
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_PRICE_ID_MONTHLY=price_xxx
STRIPE_PRICE_ID_ANNUAL=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## 4. Resend (Email)

1. Go to: https://resend.com/signup
2. Sign up (free tier: 100 emails/day)
3. Verify your domain (or use test domain for now)
4. Go to: https://resend.com/api-keys
5. Create API key
6. Copy the key (starts with `re_`)

**Save it:**
```
RESEND_API_KEY=re_xxx
SENDER_EMAIL=EarningsJr <noreply@yourdomain.com>
```

**Note:** For testing, you can use Resend's test domain: `onboarding@resend.dev`

---

## 5. Configure in Cloudflare

### **For API Worker (Backend):**

**Option A: Via Wrangler CLI (Recommended)**
```bash
cd workers/api
npx wrangler secret put STRIPE_SECRET_KEY
# Paste: sk_test_xxx
# Press Enter

npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste: whsec_xxx

npx wrangler secret put RESEND_API_KEY
# Paste: re_xxx

npx wrangler secret put SENTRY_DSN
# Paste: https://xxx@xxx.ingest.sentry.io/xxx
```

**Option B: Via Cloudflare Dashboard**
1. Go to: https://dash.cloudflare.com
2. Workers & Pages → `earningsjr-api`
3. Settings → Variables and Secrets
4. Add each secret:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY`
   - `SENTRY_DSN` (optional for backend)

### **For Pages (Frontend):**

**Via Cloudflare Dashboard:**
1. Go to: https://dash.cloudflare.com
2. Workers & Pages → Your Pages project
3. Settings → Environment Variables
4. Add these (for Production environment):

```
VITE_API_BASE=https://api.earningsjr.com
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_POSTHOG_KEY=phc_xxxxx
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_PRICE_ID_MONTHLY=price_xxx
VITE_STRIPE_PRICE_ID_ANNUAL=price_xxx
```

**Important:** After adding env vars, you need to **redeploy** Pages for them to take effect!

---

## 6. Redeploy After Setting Env Vars

```bash
# Rebuild frontend (to include env vars)
cd apps/web
pnpm build

# Redeploy Pages
npx wrangler pages deploy dist --project-name=earningsjr

# API doesn't need redeploy (secrets are runtime)
```

---

## 7. Test Everything

**Checklist:**
- [ ] Visit frontend URL
- [ ] Try registration (should send email)
- [ ] Check Sentry dashboard (should see events)
- [ ] Check PostHog dashboard (should see page views)
- [ ] Try forgot password (should send email)
- [ ] Try Stripe checkout (test mode)
- [ ] Check API health: `https://api.earningsjr.com/healthz`

---

## Quick Reference: All Keys Needed

### Backend Secrets (Cloudflare Workers):
```
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
RESEND_API_KEY=re_xxx
SENDER_EMAIL=EarningsJr <noreply@yourdomain.com> (optional)
```

### Frontend Env Vars (Cloudflare Pages):
```
VITE_API_BASE=https://api.earningsjr.com
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_POSTHOG_KEY=phc_xxxxx
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_PRICE_ID_MONTHLY=price_xxx
VITE_STRIPE_PRICE_ID_ANNUAL=price_xxx
```

---

## Troubleshooting

**"Email not sending":**
- Check Resend API key is set
- Check sender email is verified in Resend
- Check Cloudflare Worker logs

**"Stripe checkout not working":**
- Verify publishable key in frontend
- Verify secret key in backend
- Check browser console for errors

**"Analytics not tracking":**
- Check PostHog key is correct
- Check browser console for PostHog errors
- Verify events in PostHog dashboard

**"Sentry not working":**
- Check DSN is correct
- Check Sentry project is active
- Verify source maps are uploaded (optional)

---

**Once all keys are set, redeploy and test!** 🚀

