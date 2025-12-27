# ✅ Quick Setup Checklist (30 Minutes)

## 🎯 RIGHT NOW: Complete Sentry Setup

**On the Sentry page you're on:**
1. ✅ Project name: `earningsjr-web`
2. ✅ Platform: **"Browser JavaScript"** (or "React")
3. ✅ Click **"Create Project"**
4. ✅ **COPY THE DSN** (looks like `https://xxx@xxx.ingest.sentry.io/xxx`)
5. ✅ Save it somewhere: `VITE_SENTRY_DSN=your_dsn_here`

**Then create a SECOND Sentry project for backend:**
- Project name: `earningsjr-api`
- Platform: **"Cloudflare Workers"**
- Copy that DSN too: `SENTRY_DSN=your_backend_dsn`

---

## 📋 Next Steps (In Order)

### 1. PostHog (5 min)
- [ ] Go to: https://posthog.com/signup
- [ ] Sign up
- [ ] Create project: "EarningsJr"
- [ ] Copy API key: `VITE_POSTHOG_KEY=phc_xxxxx`

### 2. Stripe (10 min)
- [ ] Go to: https://dashboard.stripe.com/register
- [ ] Sign up
- [ ] Go to: https://dashboard.stripe.com/test/apikeys
- [ ] Copy **Publishable key**: `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx`
- [ ] Copy **Secret key**: `STRIPE_SECRET_KEY=sk_test_xxx`
- [ ] Create product: "EarningsJr Premium Monthly" - $9.99/month
- [ ] Copy **Price ID**: `VITE_STRIPE_PRICE_ID_MONTHLY=price_xxx`
- [ ] Create product: "EarningsJr Premium Annual" - $99/year
- [ ] Copy **Price ID**: `VITE_STRIPE_PRICE_ID_ANNUAL=price_xxx`
- [ ] Set up webhook: https://dashboard.stripe.com/test/webhooks
  - URL: `https://earningsjr-api.thejmgfam.workers.dev/stripe/webhook`
  - Events: Select all subscription events
  - Copy **Signing secret**: `STRIPE_WEBHOOK_SECRET=whsec_xxx`

### 3. Resend (5 min)
- [ ] Go to: https://resend.com/signup
- [ ] Sign up
- [ ] Go to: https://resend.com/api-keys
- [ ] Create API key
- [ ] Copy key: `RESEND_API_KEY=re_xxx`

---

## 🔧 Configure in Cloudflare

### Backend Secrets (Workers)

**Run these commands:**
```bash
cd /Users/kokougbeve/Documents/Scripts_Apps/EarningsJr/workers/api

npx wrangler secret put STRIPE_SECRET_KEY
# Paste: sk_test_xxx
# Press Enter

npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste: whsec_xxx

npx wrangler secret put RESEND_API_KEY
# Paste: re_xxx
```

### Frontend Env Vars (Pages)

**Via Cloudflare Dashboard:**
1. Go to: https://dash.cloudflare.com
2. Workers & Pages → Your Pages project (`earningsjr`)
3. Settings → Environment Variables
4. Add these (Production environment):

```
VITE_API_BASE=https://earningsjr-api.thejmgfam.workers.dev
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
VITE_POSTHOG_KEY=phc_xxxxx
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_PRICE_ID_MONTHLY=price_xxx
VITE_STRIPE_PRICE_ID_ANNUAL=price_xxx
```

**⚠️ IMPORTANT:** After adding env vars, redeploy Pages!

---

## 🚀 Redeploy After Setting Env Vars

```bash
cd /Users/kokougbeve/Documents/Scripts_Apps/EarningsJr/apps/web
pnpm build
npx wrangler pages deploy dist --project-name=earningsjr
```

---

## ✅ Test Checklist

After redeploy, test:
- [ ] Visit: https://0cdf2604.earningsjr.pages.dev (or your Pages URL)
- [ ] Try registration
- [ ] Check Sentry dashboard (should see events)
- [ ] Check PostHog dashboard (should see page views)
- [ ] Try forgot password
- [ ] Try Stripe checkout (test mode)

---

## 🆘 If Something Breaks

**"Email not sending":**
- Check Resend API key is set correctly
- Check Cloudflare Worker logs

**"Stripe not working":**
- Verify publishable key in frontend env vars
- Verify secret key in backend secrets
- Check browser console for errors

**"Analytics not tracking":**
- Check PostHog key is correct
- Check browser console

---

**Once you complete Sentry setup, come back and I'll help you with the rest!** 🚀

