# DNS Not Resolving - Setup Guide

## Issue: `api.earningsjr.com` not resolving

```
curl: (6) Could not resolve host: api.earningsjr.com
```

This means the DNS record for `api.earningsjr.com` hasn't been created yet or hasn't propagated.

---

## Solution: Add Custom Domain to Worker

### Step 1: Add Custom Domain in Cloudflare Dashboard

1. **Go to Worker settings:**
   - Cloudflare Dashboard → Workers & Pages → **Workers** (not Pages)
   - Click on `earningsjr-api`

2. **Navigate to Triggers:**
   - Click **Settings** (left sidebar)
   - Click **Triggers**
   - Scroll to **Custom Domains** section

3. **Add custom domain:**
   - Click **"Add Custom Domain"**
   - Enter: `api.earningsjr.com`
   - Select zone: `earningsjr.com`
   - Click **"Add Custom Domain"**

4. **Cloudflare will automatically:**
   - Create DNS record (CNAME or A record)
   - Provision SSL certificate
   - Route traffic to your Worker

---

## Alternative: Check if Domain Exists

### Check DNS Records

1. **Go to DNS settings:**
   - Cloudflare Dashboard → Select your account
   - Click on `earningsjr.com` domain
   - Go to **DNS** → **Records**

2. **Look for:**
   - Record name: `api` or `api.earningsjr.com`
   - Type: CNAME or A record

3. **If not there:**
   - You need to add the custom domain to the Worker (Step 1 above)

---

## Check Worker Deployment Status

### Verify Worker is deployed:

1. **Check Workers.dev URL:**
   ```bash
   curl https://earningsjr-api.thejmgfam.workers.dev/healthz
   ```

2. **If this works:**
   - Worker is deployed ✅
   - Just need to add custom domain

3. **If this doesn't work:**
   - Worker deployment failed
   - Check Cloudflare Dashboard → `earningsjr-api` → Deployments

---

## After Adding Custom Domain

### Wait for DNS propagation:
- Usually takes 1-5 minutes
- Can take up to 48 hours (rare)

### Test:
```bash
# Check DNS resolution
nslookup api.earningsjr.com

# Test API
curl https://api.earningsjr.com/healthz
```

---

## Current Pages Configuration

I can see your Pages configuration is correct:

✅ **Build command:** `pnpm install --frozen-lockfile && pnpm -C apps/web build`
✅ **Build output:** `apps/web/dist`
✅ **Environment variable:** `VITE_API_BASE=https://api.earningsjr.com`
✅ **Domain:** `earningsjr.com` is working

**Note:** After adding the Worker custom domain, you'll need to **redeploy Pages** for it to use the correct API URL.

---

## Quick Test: Use Workers.dev URL Temporarily

If you want to test immediately without waiting for DNS:

1. **Update Pages environment variable:**
   - Change `VITE_API_BASE` to: `https://earningsjr-api.thejmgfam.workers.dev`
   - Redeploy Pages

2. **Test:**
   - Visit `https://earningsjr.com`
   - App should work with workers.dev URL

3. **After custom domain works:**
   - Change back to `https://api.earningsjr.com`
   - Redeploy Pages

---

## Troubleshooting

### Worker not deployed?

```bash
cd workers/api
npx wrangler deploy
```

### Custom domain not showing up?

- Ensure `earningsjr.com` zone is managed by Cloudflare (not external DNS)
- Check that you're adding it to the **Worker** (not Pages)
- The setting is in: Workers & Pages → **Workers** → `earningsjr-api` → Settings → Triggers → Custom Domains

### Still not resolving after 10 minutes?

- Check if the zone is active in Cloudflare
- Try using the workers.dev URL temporarily
- Contact Cloudflare support if issue persists

---

## Summary

**To fix:**
1. Add `api.earningsjr.com` as a custom domain to the `earningsjr-api` Worker
2. Wait 1-5 minutes for DNS propagation
3. Test with `curl https://api.earningsjr.com/healthz`
4. Should return `{"status":"ok"}`

**Pages is already configured correctly!** ✅

