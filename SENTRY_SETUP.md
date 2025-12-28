# 🔍 Sentry Setup Guide

## Overview

Sentry is configured for both:
- **Frontend (Pages)**: Uses `VITE_SENTRY_DSN` (already set in GitHub secrets)
- **Backend (Workers)**: Uses `SENTRY_DSN` (needs to be set)

---

## ✅ Frontend Sentry (Already Configured)

**GitHub Secret:** `VITE_SENTRY_DSN`
- Already set in repository secrets
- Used by `apps/web/src/main.tsx`
- Automatically captures frontend errors

---

## 🔧 Backend Sentry Setup (Workers)

### Step 1: Create Sentry Project for Workers

1. Go to: https://sentry.io
2. Navigate to your organization
3. Click **"Create Project"**
4. Choose platform: **"Cloudflare Workers"**
5. Project name: `earningsjr-api` (or `earningsjr-workers`)
6. Click **"Create Project"**
7. Copy the **DSN** (looks like: `https://xxx@xxx.ingest.sentry.io/xxx`)

### Step 2: Add Secret to Cloudflare Worker

**Option A: Using Wrangler CLI (Recommended)**

```bash
cd workers/api
npx wrangler secret put SENTRY_DSN
```

When prompted, paste your Sentry DSN.

**Option B: Using Cloudflare Dashboard**

1. Go to: https://dash.cloudflare.com
2. Workers & Pages → `earningsjr-api`
3. Settings → Variables and Secrets
4. Under "Secrets", click "Add secret"
5. Name: `SENTRY_DSN`
6. Value: Paste your Sentry DSN
7. Click "Save"

### Step 3: Verify Setup

After adding the secret, the Worker will automatically:
- Initialize Sentry on first request
- Capture unhandled errors
- Send errors to your Sentry project

---

## 🧪 Testing Sentry

### Test Frontend Sentry

1. Open browser console on your site
2. Run: `Sentry.captureException(new Error('Test error'))`
3. Check Sentry dashboard → Should see the error

### Test Backend Sentry

1. Make a request that causes an error (e.g., invalid endpoint)
2. Check Sentry dashboard → Should see the error
3. Or add a test error in code temporarily:
   ```typescript
   throw new Error('Test Sentry error');
   ```

---

## 📊 Viewing Errors

### Frontend Errors
- Go to: https://sentry.io
- Navigate to: `earningsjr-web` project
- Click "Issues" to see all errors

### Backend Errors
- Go to: https://sentry.io
- Navigate to: `earningsjr-api` project
- Click "Issues" to see all errors

---

## 🔑 Secrets Summary

### GitHub Repository Secrets (for Pages deployment)
- `VITE_SENTRY_DSN` - Frontend Sentry DSN ✅ (Already set)

### Cloudflare Worker Secrets (for API)
- `SENTRY_DSN` - Backend Sentry DSN ⚠️ (Need to add)

---

## ✅ Quick Setup Command

```bash
# 1. Get your Sentry DSN from https://sentry.io
# 2. Add it to Cloudflare Worker:
cd workers/api
npx wrangler secret put SENTRY_DSN

# 3. Paste your DSN when prompted
# 4. Done! Errors will now be captured
```

---

## 🎯 What Gets Captured

### Frontend (Pages)
- React component errors
- Unhandled promise rejections
- API call errors
- User interactions (breadcrumbs)

### Backend (Workers)
- Unhandled exceptions in API routes
- Cron job errors
- Database errors
- Stripe webhook errors

---

## 💡 Pro Tips

1. **Set up alerts**: In Sentry, configure alerts for high-priority errors
2. **Filter by environment**: Use different DSNs for dev/prod (optional)
3. **Add context**: Errors automatically include request context, user info, etc.
4. **Check regularly**: Review Sentry dashboard daily during launch week

---

## 🆘 Troubleshooting

**Errors not showing in Sentry?**
- Verify DSN is correct
- Check Sentry project is active
- Verify secret is set in Cloudflare
- Check Worker logs for Sentry initialization errors

**Too many errors?**
- Adjust `tracesSampleRate` in code (currently 1.0 = 100%)
- Set up filters in Sentry dashboard
- Add error grouping rules

