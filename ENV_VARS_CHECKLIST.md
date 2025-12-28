# ✅ Environment Variables Checklist

## Frontend Variables (GitHub Secrets)

Go to: https://github.com/smartdealmind/earningsjr/settings/secrets/actions

### Required Secrets:
- [ ] `VITE_API_BASE` - API URL
- [ ] `VITE_POSTHOG_KEY` - PostHog project API key
- [ ] `VITE_POSTHOG_HOST` - PostHog host
- [ ] `VITE_SENTRY_DSN` - Sentry frontend DSN
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `VITE_STRIPE_PRICE_ID_MONTHLY` - Monthly price: `price_1SjOmYHy1vP8dbEz0geH4gfI`
- [ ] `VITE_STRIPE_PRICE_ID_YEARLY` - Yearly price: `price_1SjOmZHy1vP8dbEzzIrgRjvG`

### Deployment Secrets:
- [ ] `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- [ ] `CLOUDFLARE_API_TOKEN` - Cloudflare API token

---

## Backend Variables (Cloudflare Worker Secrets)

Run: `cd workers/api && npx wrangler secret list`

### Required Secrets:
- [x] `RESEND_API_KEY` ✅
- [x] `SENDER_EMAIL` ✅
- [x] `SENTRY_DSN` ✅
- [x] `STRIPE_SECRET_KEY` ✅
- [x] `STRIPE_WEBHOOK_SECRET` ✅

---

## Quick Verification

### Check GitHub Secrets:
https://github.com/smartdealmind/earningsjr/settings/secrets/actions

### Check Cloudflare Secrets:
```bash
cd workers/api
npx wrangler secret list
```

