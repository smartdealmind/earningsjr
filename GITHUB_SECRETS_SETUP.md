# GitHub Secrets Setup Guide

## The Problem You Were Experiencing

**Why environment variables kept getting "wiped":**

- You were adding environment variables in **Cloudflare Pages Dashboard**
- But the build happens in **GitHub Actions**, not Cloudflare
- GitHub Actions builds the site with hardcoded values, then uploads the static files
- So Cloudflare's environment variables had no effect!

## Solution: Add GitHub Secrets

All frontend environment variables must be added as **GitHub Secrets** so they're available during the GitHub Actions build.

---

## Required GitHub Secrets

Go to: `https://github.com/smartdealmind/earningsjr/settings/secrets/actions`

### 1. Already Set ✅
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

### 2. Frontend Environment Variables (ADD THESE)

| Secret Name | Type | Where to Get It | Example Value |
|-------------|------|-----------------|---------------|
| `VITE_API_BASE` | Optional | Your custom domain | `https://api.earningsjr.com` |
| `VITE_POSTHOG_KEY` | **Required** | PostHog dashboard → Project Settings → API Key | `phc_xxxxxxxxxxxxx` |
| `VITE_POSTHOG_HOST` | **Required** | PostHog host URL | `https://us.i.posthog.com` |
| `VITE_SENTRY_DSN` | **Required** | Sentry project → Settings → Client Keys (DSN) | `https://abc123@o123456.ingest.us.sentry.io/123456` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | **Required** | Stripe dashboard → Developers → API keys → Publishable key | `pk_test_xxxxxxxxxxxxx` or `pk_live_xxxxxxxxxxxxx` |

### 3. Worker Secrets (Already Set via Wrangler CLI) ✅
These are set separately using `wrangler secret put` and are NOT in GitHub:
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`
- `SENTRY_DSN` (for Worker)
- `SENDER_EMAIL`

---

## How to Add GitHub Secrets

1. Go to `https://github.com/smartdealmind/earningsjr/settings/secrets/actions`
2. Click **"New repository secret"**
3. Enter the **Name** (e.g., `VITE_POSTHOG_KEY`)
4. Enter the **Value** (the actual key/URL)
5. Click **"Add secret"**
6. Repeat for each secret above

---

## After Adding Secrets

1. **Commit the workflow change** (already done in this session)
2. **Push to trigger a new deployment**
3. **The build will now have all environment variables baked in**

---

## Testing

After deployment completes, visit `https://earningsjr.com` and check:

1. **Open DevTools Console** - should NOT see:
   - ❌ `Stripe() with your publishable key. You used an empty string`
   - ❌ `POST https://...undefined/auth/...`

2. **API calls should go to** `https://api.earningsjr.com`

3. **PostHog and Sentry should initialize** (no errors in console)

---

## Why This Approach?

**GitHub Actions builds static files** with environment variables "baked in" at build time. The workflow:

1. GitHub Actions builds → env vars become part of the JS bundle
2. Uploads static files to Cloudflare Pages
3. Cloudflare serves those files

**Cloudflare Pages environment variables** only work when Cloudflare does the build (which we're not using).

---

## Quick Checklist

- [ ] Go to GitHub repo secrets
- [ ] Add `VITE_POSTHOG_KEY`
- [ ] Add `VITE_POSTHOG_HOST`
- [ ] Add `VITE_SENTRY_DSN`
- [ ] Add `VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] Optionally add `VITE_API_BASE` (defaults to `https://api.earningsjr.com`)
- [ ] Push this commit to trigger new deployment
- [ ] Wait for GitHub Actions to complete
- [ ] Test at `https://earningsjr.com`

---

## Notes

- **Secrets are encrypted** and never exposed in logs
- **You can update secrets anytime** without changing code
- **After updating a secret**, trigger a new deployment (push a commit or use manual workflow dispatch)

