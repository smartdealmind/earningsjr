# Next Steps After Domain Setup

## ✅ What You've Completed

1. ✅ Set up `earningsjr.com` and `www.earningsjr.com` for Pages
2. ✅ Set up `api.earningsjr.com` for Worker

---

## 🔍 Verification Steps

### 1. Test API Domain

Wait a few minutes for DNS propagation, then test:

```bash
# Test health endpoint
curl https://api.earningsjr.com/healthz

# Should return: {"status":"ok"} or similar
```

**Or in browser:**
- Visit: `https://api.earningsjr.com/healthz`
- Should see a JSON response

### 2. Test Frontend Domain

```bash
# Test frontend
curl -I https://earningsjr.com

# Should return HTTP 200
```

**Or in browser:**
- Visit: `https://earningsjr.com`
- Should load your EarningsJr app

---

## ⚙️ Configuration Updates Needed

### 1. Update Pages Environment Variable

**In Cloudflare Dashboard:**

1. Go to: **Workers & Pages** → **Pages** → **`earningsjr`**
2. Click: **Settings** → **Environment Variables**
3. Add/Update for **Production** environment:
   ```
   VITE_API_BASE = https://api.earningsjr.com
   ```
4. Click **Save**

**⚠️ Important:** After adding/updating env vars, you need to **redeploy** Pages:

**Option A: Via Dashboard**
- Go to: **Deployments** tab
- Click **"Retry deployment"** on the latest deployment
- Or push a new commit to trigger a new deployment

**Option B: Via GitHub Actions**
- Go to: https://github.com/smartdealmind/earningsjr/actions
- Run the "Deploy to Cloudflare Pages" workflow manually

**Option C: Via CLI**
```bash
cd apps/web
pnpm build
npx wrangler pages deploy dist --project-name=earningsjr
```

### 2. Update Stripe Webhook URL

**In Stripe Dashboard:**

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Edit your existing webhook (or create new)
3. Update URL to: `https://api.earningsjr.com/stripe/webhook`
4. Save changes

---

## 🧪 Testing Checklist

After updating environment variables and redeploying:

- [ ] Frontend loads at `https://earningsjr.com`
- [ ] API health check works: `https://api.earningsjr.com/healthz`
- [ ] Frontend can make API calls (check browser console for errors)
- [ ] Login/registration works
- [ ] Stripe checkout works (if configured)
- [ ] CORS is working (no CORS errors in browser console)

---

## 🔧 Troubleshooting

### API returns 404 or not accessible

1. **Check Worker deployment:**
   - Workers & Pages → Workers → `earningsjr-api` → Deployments
   - Ensure latest deployment is successful

2. **Check custom domain status:**
   - Workers & Pages → Workers → `earningsjr-api` → Settings → Triggers
   - Verify `api.earningsjr.com` shows as "Active" (not "Verifying")

3. **Check DNS:**
   - Cloudflare Dashboard → DNS → Records
   - Should see a record for `api.earningsjr.com`
   - Type should be CNAME or A record

### Frontend can't connect to API

1. **Check environment variable:**
   - Verify `VITE_API_BASE=https://api.earningsjr.com` is set
   - Must be in **Production** environment (not Preview)

2. **Redeploy Pages:**
   - Environment variables only apply to new deployments
   - Redeploy after adding/updating env vars

3. **Check browser console:**
   - Open DevTools → Console
   - Look for CORS errors or 404 errors
   - API calls should go to `https://api.earningsjr.com`

### CORS Errors

If you see CORS errors:

1. **Verify CORS origins in Worker code:**
   - Check `workers/api/src/index.ts`
   - Ensure `https://earningsjr.com` is in `ALLOWED_ORIGINS`

2. **Redeploy Worker:**
   - After updating CORS, redeploy the Worker

---

## 📝 Summary

**Current Setup:**
- ✅ Frontend: `https://earningsjr.com` (Pages project: `earningsjr`)
- ✅ API: `https://api.earningsjr.com` (Worker project: `earningsjr-api`)

**Next Actions:**
1. Update `VITE_API_BASE` environment variable in Pages
2. Redeploy Pages to apply the env var
3. Update Stripe webhook URL
4. Test everything works end-to-end

---

## 🎉 You're Almost Done!

Once you've:
- ✅ Updated the environment variable
- ✅ Redeployed Pages
- ✅ Verified everything works

Your EarningsJr app will be fully live with custom domains! 🚀

