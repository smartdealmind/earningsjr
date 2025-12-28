# 🔐 Environment Variables & Secrets Guide

## Overview

EarningsJr uses **two separate systems** for managing secrets and environment variables:

1. **GitHub Repository Secrets** → For frontend (Cloudflare Pages)
2. **Cloudflare Worker Secrets** → For backend (Cloudflare Workers)

---

## 📍 Frontend Secrets (GitHub Repository Secrets)

**Location:** GitHub → Repository → Settings → Secrets and variables → Actions

**Why GitHub?** Cloudflare Pages are deployed via GitHub Actions, so secrets are needed during the build process.

### Current Frontend Secrets:

| Secret Name | Purpose | Used By |
|------------|---------|---------|
| `VITE_API_BASE` | API endpoint URL | `apps/web/src/api.ts` |
| `VITE_POSTHOG_KEY` | PostHog analytics key | `apps/web/src/main.tsx` |
| `VITE_POSTHOG_HOST` | PostHog host URL | `apps/web/src/main.tsx` |
| `VITE_SENTRY_DSN` | Sentry error tracking (frontend) | `apps/web/src/main.tsx` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key | `apps/web/src/pages/Pricing.tsx` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | GitHub Actions deployment |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | GitHub Actions deployment |

### How to Add Frontend Secret:

1. Go to: https://github.com/smartdealmind/earningsjr/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `VITE_WHATEVER` (must start with `VITE_` for Vite to expose it)
4. Value: Your secret value
5. Click **"Add secret"**

### Accessing in Code:

```typescript
// In apps/web/src/any-file.ts
const apiKey = import.meta.env.VITE_API_BASE; // ✅ Works
const secret = import.meta.env.SECRET_KEY; // ❌ Won't work (not prefixed with VITE_)
```

---

## 🔧 Backend Secrets (Cloudflare Worker Secrets)

**Location:** Cloudflare Dashboard → Workers & Pages → `earningsjr-api` → Settings → Variables and Secrets

**Why Cloudflare?** Workers run directly on Cloudflare, so secrets are accessed at runtime via `env.SECRET_NAME`.

### Current Backend Secrets:

| Secret Name | Purpose | Used By |
|------------|---------|---------|
| `RESEND_API_KEY` | Resend email API key | `workers/api/src/index.ts` |
| `SENDER_EMAIL` | Email sender address | `workers/api/src/index.ts` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `workers/api/src/index.ts` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `workers/api/src/index.ts` |
| `SENTRY_DSN` | Sentry error tracking (backend) | `workers/api/src/index.ts` |

### How to Add Backend Secret:

**Option A: Using Wrangler CLI (Recommended)**

```bash
cd workers/api
npx wrangler secret put SECRET_NAME
# Paste your secret when prompted
```

**Option B: Using Cloudflare Dashboard**

1. Go to: https://dash.cloudflare.com
2. Workers & Pages → `earningsjr-api`
3. Settings → Variables and Secrets
4. Under "Secrets", click **"Add secret"**
5. Name: `SECRET_NAME`
6. Value: Your secret value
7. Click **"Save"**

### Accessing in Code:

```typescript
// In workers/api/src/index.ts
type Bindings = {
  SECRET_NAME: string; // Add to type
};

// In your handler
app.get('/endpoint', async (c) => {
  const secret = c.env.SECRET_NAME; // ✅ Works
  // ...
});
```

---

## 🎯 Quick Decision Tree

**Is it a frontend variable?**
- ✅ Starts with `VITE_` → GitHub Secret
- ✅ Used in `apps/web/` → GitHub Secret
- ✅ Needed during build → GitHub Secret

**Is it a backend secret?**
- ✅ Used in `workers/api/src/index.ts` as `env.SOMETHING` → Cloudflare Worker Secret
- ✅ API key, webhook secret, database password → Cloudflare Worker Secret
- ✅ Runtime configuration → Cloudflare Worker Secret

**Is it a deployment token?**
- ✅ `CLOUDFLARE_*` → GitHub Secret (used by GitHub Actions)

---

## 📋 Complete Checklist

### Frontend (GitHub Secrets)
- [x] `VITE_API_BASE`
- [x] `VITE_POSTHOG_KEY`
- [x] `VITE_POSTHOG_HOST`
- [x] `VITE_SENTRY_DSN`
- [x] `VITE_STRIPE_PUBLISHABLE_KEY`
- [x] `CLOUDFLARE_ACCOUNT_ID`
- [x] `CLOUDFLARE_API_TOKEN`

### Backend (Cloudflare Worker Secrets)
- [x] `RESEND_API_KEY`
- [x] `SENDER_EMAIL`
- [x] `STRIPE_SECRET_KEY`
- [x] `STRIPE_WEBHOOK_SECRET`
- [ ] `SENTRY_DSN` ⚠️ **Needs to be added**

---

## 🔄 When to Use Each

### Use GitHub Secrets When:
- Variable is needed during **build time**
- Variable is used in frontend code (`apps/web/`)
- Variable starts with `VITE_`
- Variable is a deployment token

### Use Cloudflare Secrets When:
- Secret is needed at **runtime** in Workers
- Secret is an API key or sensitive credential
- Secret is accessed via `env.SECRET_NAME` in Worker code
- Secret should never be exposed to the build process

---

## 🚨 Security Best Practices

1. **Never commit secrets to git** - Always use secrets management
2. **Use different values for dev/prod** - Consider separate projects
3. **Rotate secrets regularly** - Especially API keys
4. **Limit secret access** - Only add secrets that are actually needed
5. **Use descriptive names** - Make it clear what each secret is for

---

## 📝 Adding a New Secret

### Frontend Example: Adding `VITE_NEW_FEATURE_KEY`

1. Go to GitHub → Settings → Secrets → Actions
2. Add `VITE_NEW_FEATURE_KEY` with your value
3. Use in code: `import.meta.env.VITE_NEW_FEATURE_KEY`
4. Redeploy Pages (automatic on next push)

### Backend Example: Adding `NEW_API_KEY`

1. Run: `cd workers/api && npx wrangler secret put NEW_API_KEY`
2. Add to `Bindings` type in `workers/api/src/index.ts`:
   ```typescript
   type Bindings = {
     NEW_API_KEY: string;
   };
   ```
3. Use in code: `c.env.NEW_API_KEY`
4. Redeploy Worker (automatic on next push)

---

## ✅ Verification

### Check Frontend Secrets:
```bash
# Secrets are injected during build
# Check GitHub Actions logs to verify they're being used
```

### Check Backend Secrets:
```bash
cd workers/api
npx wrangler secret list
# Should show all your secrets
```

---

## 🆘 Troubleshooting

**Frontend variable not working?**
- ✅ Check it starts with `VITE_`
- ✅ Check it's in GitHub Secrets (not Cloudflare)
- ✅ Check GitHub Actions build logs
- ✅ Redeploy Pages

**Backend secret not working?**
- ✅ Check it's in Cloudflare Worker Secrets (not GitHub)
- ✅ Check it's in the `Bindings` type
- ✅ Check Worker logs: `npx wrangler tail`
- ✅ Redeploy Worker

**Secret not found error?**
- ✅ Verify secret name matches exactly (case-sensitive)
- ✅ Check you're looking in the right place (GitHub vs Cloudflare)
- ✅ Ensure secret was saved successfully

