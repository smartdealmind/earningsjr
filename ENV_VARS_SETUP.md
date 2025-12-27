# Environment Variables Setup - CRITICAL

## ❌ Current Issue

You're seeing errors because environment variables are **NOT set** in Cloudflare Pages.

**Errors seen:**
- `undefined/auth/forgot-password` (VITE_API_BASE is undefined)
- `Stripe() with your publishable key. You used an empty string.` (VITE_STRIPE_PUBLISHABLE_KEY is undefined)

---

## ✅ Fix: Add Environment Variables to Cloudflare Pages

### Step 1: Go to Cloudflare Pages Settings

1. **Go to:** https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** → **Pages**
3. Click on: **`earningsjr`** (NOT chorecoins)
4. Click: **Settings** → **Environment Variables**

### Step 2: Add These Variables for Production

Click **"Add variable"** and add each one:

#### Required (Must Have):
```
Name: VITE_API_BASE
Value: https://api.earningsjr.com
Environment: Production
```

#### For Analytics (Recommended):
```
Name: VITE_POSTHOG_KEY
Value: phc_YOUR_KEY_HERE
Environment: Production
```

```
Name: VITE_POSTHOG_HOST  
Value: https://app.posthog.com
Environment: Production
```

```
Name: VITE_SENTRY_DSN
Value: https://xxx@xxx.ingest.sentry.io/xxx
Environment: Production
```

#### For Stripe (Add Later):
```
Name: VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_test_YOUR_KEY
Environment: Production
```

```
Name: VITE_STRIPE_PRICE_ID_MONTHLY
Value: price_YOUR_ID
Environment: Production
```

```
Name: VITE_STRIPE_PRICE_ID_ANNUAL
Value: price_YOUR_ID
Environment: Production
```

### Step 3: Save and Redeploy

After adding variables:
1. Click **"Save"**
2. Go to **Deployments** tab
3. Click **"Retry deployment"** on the latest deployment

Or trigger a new deployment by pushing a commit.

---

## ✅ Verify Setup

### Check the correct domain:

**OLD (don't use):** https://chorecoins.pages.dev ❌
**NEW (use this):** https://earningsjr.pages.dev ✅
**CUSTOM:** https://earningsjr.com ✅

### After redeployment, test:

1. Visit: https://earningsjr.com
2. Open browser console (F12)
3. Try any action (like forgot password)
4. API calls should go to `https://api.earningsjr.com` (not undefined)

---

## Common Mistakes

### ❌ Wrong:
- Setting variables in **Preview** environment instead of **Production**
- Setting variables in **Worker** instead of **Pages**
- Not redeploying after setting variables
- Using old `chorecoins.pages.dev` domain

### ✅ Correct:
- Variables set in **Production** environment
- Variables set in **Pages** project (`earningsjr`)
- Redeployed after setting variables
- Using new `earningsjr.com` or `earningsjr.pages.dev`

---

## Screenshot Guide

When adding variables, make sure:
1. **Project:** `earningsjr` (at the top)
2. **Tab:** "Environment Variables"
3. **Environment:** Select "Production" from dropdown
4. **Type:** "Plaintext" (NOT "Secret")
5. Click **"Add variable"** for each one

---

## After Setup

Once environment variables are set and redeployed:
- ✅ API calls will go to `https://api.earningsjr.com`
- ✅ PostHog will track events
- ✅ Sentry will catch errors
- ✅ Stripe will work (when you add keys)

---

## Quick Test

After redeployment, run this in browser console on `https://earningsjr.com`:

```javascript
console.log('API Base:', import.meta.env.VITE_API_BASE)
console.log('PostHog:', import.meta.env.VITE_POSTHOG_KEY ? 'Set' : 'Not set')
console.log('Sentry:', import.meta.env.VITE_SENTRY_DSN ? 'Set' : 'Not set')
```

Should show actual values, not `undefined`.

---

## Important Note

**You MUST redeploy after adding environment variables!**

Environment variables are baked into the build at build-time. Just adding them doesn't update the live site - you need to rebuild.

