# EarningsJr Deployment Status & Testing Guide

## 🎯 Deployment Checklist

### ✅ Infrastructure Created
- ✅ D1 Database: `earningsjr_db` (9660b412-facc-4c69-a993-938806569284)
- ✅ R2 Bucket: `earningsjr-assets`
- ✅ KV Namespace: `SESSION_KV` (e740282ef5744352bf5964730389aa6b)
- ✅ All 10 migrations run successfully

### ✅ Custom Domains Configured
- ✅ Frontend: `earningsjr.com` and `www.earningsjr.com`
- ✅ API: `api.earningsjr.com`

### ✅ GitHub Actions
- ✅ `deploy-pages.yml` - Auto-deploys frontend
- ✅ `deploy-workers.yml` - Auto-deploys API
- ✅ Permissions configured correctly

### ✅ Cloudflare Workers
- ✅ Project: `earningsjr-api`
- ✅ Deploy command fixed: `pnpm -C workers/api exec wrangler deploy`
- ✅ Latest deployment should be in progress

---

## 🧪 Testing Guide

### 1. Test API Health Endpoint

```bash
curl https://api.earningsjr.com/healthz
```

**Expected response:**
```json
{"status":"ok"}
```

Or in browser: https://api.earningsjr.com/healthz

---

### 2. Test Frontend

Visit: https://earningsjr.com

**Expected:**
- ✅ Site loads
- ✅ No CORS errors in browser console (F12)
- ✅ Can see login/register page

---

### 3. Test Database Connection

Try registering a new account:
1. Go to: https://earningsjr.com
2. Click "Register" or "Get Started"
3. Fill in parent registration form
4. Submit

**Expected:**
- ✅ Email verification sent (or account created)
- ✅ No errors in console
- ✅ Data saved to D1 database

---

### 4. Test CORS

Open browser console (F12) on https://earningsjr.com

**Expected:**
- ✅ No CORS errors
- ✅ API calls to `api.earningsjr.com` work
- ✅ Credentials/cookies sent properly

**If CORS errors:**
- Check that `VITE_API_BASE=https://api.earningsjr.com` is set in Pages environment variables
- Redeploy Pages after setting env var

---

### 5. Test API Endpoints

```bash
# Health check
curl https://api.earningsjr.com/healthz

# Me endpoint (should return 401 unauthorized)
curl https://api.earningsjr.com/me

# Register endpoint (test)
curl -X POST https://api.earningsjr.com/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

---

## 🔍 Troubleshooting

### API returns 404

**Check:**
1. Worker deployed successfully
2. Custom domain `api.earningsjr.com` is active
3. Route is configured in `wrangler.toml`

**Fix:**
```bash
cd workers/api
npx wrangler deploy
```

---

### Frontend can't connect to API

**Check Pages environment variables:**
1. Cloudflare Dashboard → Pages → `earningsjr` → Settings → Environment Variables
2. Ensure `VITE_API_BASE=https://api.earningsjr.com` is set
3. Redeploy Pages after adding

**Quick fix:**
```bash
cd apps/web
pnpm build
npx wrangler pages deploy dist --project-name=earningsjr
```

---

### Database errors

**Verify migrations:**
```bash
cd workers/api
npx wrangler d1 execute earningsjr_db --remote --command "SELECT name FROM sqlite_master WHERE type='table';"
```

**Expected:** Should list all 22 tables

---

### CORS errors

**Check CORS origins in code:**
File: `workers/api/src/index.ts`

Should include:
```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://earningsjr.pages.dev',
  'https://earningsjr.com',
  'https://www.earningsjr.com',
  'https://api.earningsjr.com'
];
```

---

## 📊 Monitoring

### Check Deployments

**GitHub Actions:**
- https://github.com/smartdealmind/earningsjr/actions

**Cloudflare Workers:**
- Dashboard → Workers & Pages → `earningsjr-api` → Deployments

**Cloudflare Pages:**
- Dashboard → Workers & Pages → `earningsjr` → Deployments

---

### Check Logs

**Worker Logs:**
```bash
cd workers/api
npx wrangler tail
```

Or in Dashboard: Workers & Pages → `earningsjr-api` → Observability → Logs

**Pages Build Logs:**
- Dashboard → Pages → `earningsjr` → Deployments → Latest deployment

---

## ✅ Success Criteria

Everything is working when:

1. ✅ `https://api.earningsjr.com/healthz` returns `{"status":"ok"}`
2. ✅ `https://earningsjr.com` loads the app
3. ✅ No CORS errors in browser console
4. ✅ Can register a new account
5. ✅ Can log in
6. ✅ Dashboard loads after login

---

## 🚀 Next Steps After Testing

1. **Add Environment Variables** (if not already set):
   - Stripe keys
   - Resend API key
   - Sentry DSN
   - PostHog keys

2. **Set up Stripe Webhook:**
   - URL: `https://api.earningsjr.com/stripe/webhook`
   - Events: All subscription events

3. **Test Payment Flow:**
   - Try upgrading to premium
   - Verify webhook works

4. **Production Readiness:**
   - Test all features
   - Load test if needed
   - Set up monitoring/alerts

---

## 📝 Configuration Summary

| Resource | Name | URL/ID |
|----------|------|--------|
| **Frontend** | `earningsjr` | https://earningsjr.com |
| **API Worker** | `earningsjr-api` | https://api.earningsjr.com |
| **D1 Database** | `earningsjr_db` | 9660b412-facc-4c69-a993-938806569284 |
| **R2 Bucket** | `earningsjr-assets` | - |
| **KV Namespace** | `SESSION_KV` | e740282ef5744352bf5964730389aa6b |
| **GitHub Repo** | `smartdealmind/earningsjr` | https://github.com/smartdealmind/earningsjr |

---

## 🎉 You're Ready!

If all the above tests pass, your EarningsJr app is fully deployed and ready to use!

