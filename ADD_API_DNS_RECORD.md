# Add DNS Record for api.earningsjr.com

## Issue

You have the Worker route configured (`api.earningsjr.com/*`) but there's **NO DNS record** for `api.earningsjr.com`.

Looking at your DNS records, you have:
- ✅ `earningsjr.com` → earningsjr.pages.dev
- ✅ `www` → earningsjr.pages.dev
- ❌ **Missing:** `api` → (nothing)

---

## Solution: Add DNS Record

### Option 1: Automatic (Cloudflare Should Create This)

When you add a custom domain to a Worker, Cloudflare usually creates the DNS record automatically. Let me check if it's just not showing...

### Option 2: Manual (If Automatic Didn't Work)

Add the DNS record manually:

1. **Go to:** Cloudflare Dashboard → Your Account → `earningsjr.com` domain → DNS → Records

2. **Click:** "Add record"

3. **Fill in:**
   ```
   Type: CNAME
   Name: api
   Target: earningsjr-api.thejmgfam.workers.dev
   Proxy status: Proxied (orange cloud)
   TTL: Auto
   ```

4. **Click:** "Save"

### Option 3: Use the Worker's Custom Domain Feature

This should create the DNS record automatically:

1. **Go to:** Workers & Pages → `earningsjr-api` → Settings → Triggers
2. **Under "Custom Domains"** section
3. Click **"Add Custom Domain"**
4. Enter: `api.earningsjr.com`
5. Select zone: `earningsjr.com`
6. Click **"Add Custom Domain"**

This will create both the route AND the DNS record.

---

## Which Record to Add

**Add this DNS record:**

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| CNAME | `api` | `earningsjr-api.thejmgfam.workers.dev` | ✅ Proxied | Auto |

---

## After Adding

1. Wait 1-2 minutes for DNS propagation
2. Test: `curl https://api.earningsjr.com/healthz`
3. Should return a response (even if it's still error 1042)

---

## Why This Happened

The Worker route (`api.earningsjr.com/*`) tells Cloudflare "if traffic comes to this domain, send it to the Worker". But there's no DNS record telling the internet "api.earningsjr.com points to Cloudflare's servers".

It's like having a forwarding address without actually receiving mail at that address.

---

## Quick Test

After adding the DNS record:

```bash
# Check if DNS resolves
nslookup api.earningsjr.com

# Should show Cloudflare IPs like:
# 104.21.x.x or 172.67.x.x

# Test the endpoint
curl https://api.earningsjr.com/healthz
```

