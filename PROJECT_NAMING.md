# Project Naming & Domain Setup

## Cloudflare Projects Overview

You have **TWO separate projects** in Cloudflare:

### 1. **Worker (API Backend)**
- **Project Name:** `earningsjr-api`
- **Location:** Workers & Pages → Workers → `earningsjr-api`
- **Purpose:** Handles all API requests (auth, chores, payments, etc.)
- **Custom Domain:** `api.earningsjr.com`
- **Default URL:** `https://earningsjr-api.YOUR_SUBDOMAIN.workers.dev`

### 2. **Pages (Frontend)**
- **Project Name:** `earningsjr`
- **Location:** Workers & Pages → Pages → `earningsjr`
- **Purpose:** Serves the React web app
- **Custom Domains:** `earningsjr.com`, `www.earningsjr.com`
- **Default URL:** `https://earningsjr.pages.dev`

---

## How to Add `api.earningsjr.com` to the Worker

### Step-by-Step Instructions

1. **Go to the Worker project:**
   - Cloudflare Dashboard → **Workers & Pages** → **Workers**
   - Click on **`earningsjr-api`** (NOT the Pages project)

2. **Navigate to Custom Domains:**
   - Click **Settings** (left sidebar)
   - Click **Triggers** (under Settings)
   - Scroll to **Custom Domains** section

3. **Add the custom domain:**
   - Click **"Add Custom Domain"** button
   - Enter: `api.earningsjr.com`
   - Select zone: `earningsjr.com` (must be managed by Cloudflare)
   - Click **"Add Custom Domain"**

4. **Cloudflare will automatically:**
   - Create DNS records (CNAME or A record)
   - Provision SSL certificate
   - Route traffic from `api.earningsjr.com` to your Worker

5. **Verification:**
   - Wait a few minutes for DNS propagation
   - Test: `https://api.earningsjr.com/healthz`
   - Should return a health check response

---

## Visual Guide: Where to Find Each Project

```
Cloudflare Dashboard
├── Workers & Pages
    ├── Workers
    │   └── earningsjr-api  ← API Backend (add api.earningsjr.com here)
    │       └── Settings → Triggers → Custom Domains
    │
    └── Pages
        └── earningsjr  ← Frontend (earningsjr.com already set up here)
            └── Settings → Custom Domains
```

---

## Domain Summary

| Project | Project Name | Custom Domain | Purpose |
|---------|-------------|---------------|---------|
| **Worker** | `earningsjr-api` | `api.earningsjr.com` | API Backend |
| **Pages** | `earningsjr` | `earningsjr.com` | Frontend |
| **Pages** | `earningsjr` | `www.earningsjr.com` | Frontend (www) |

---

## Important Notes

1. **Different Projects:** The Worker and Pages are **separate projects** with different names
   - Worker = `earningsjr-api` (in Workers section)
   - Pages = `earningsjr` (in Pages section)

2. **Custom Domains:**
   - `api.earningsjr.com` → Goes to **Worker** (`earningsjr-api`)
   - `earningsjr.com` → Goes to **Pages** (`earningsjr`)
   - `www.earningsjr.com` → Goes to **Pages** (`earningsjr`)

3. **DNS Requirements:**
   - The `earningsjr.com` zone must be managed by Cloudflare
   - Cloudflare will create DNS records automatically
   - No manual DNS changes needed

4. **After Adding Domain:**
   - Update Pages environment variable: `VITE_API_BASE=https://api.earningsjr.com`
   - Redeploy Pages for the change to take effect

---

## Troubleshooting

### "Zone not found" error
- Ensure `earningsjr.com` is added to Cloudflare
- The zone must be active (not just DNS-only)

### Domain shows "Verifying" for a long time
- Check DNS records in Cloudflare DNS dashboard
- Ensure the zone is properly configured
- Can take up to 48 hours, but usually works within minutes

### API not accessible after adding domain
- Verify the Worker is deployed: Workers & Pages → `earningsjr-api` → Deployments
- Check that the route in `wrangler.toml` matches: `api.earningsjr.com/*`
- Test the health endpoint: `https://api.earningsjr.com/healthz`

