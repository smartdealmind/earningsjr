# Domain Configuration for EarningsJr

## API Domain Setup

The API is configured to use a custom domain: **`api.earningsjr.com`**

### Configuration

1. **Worker Route** (in `wrangler.toml`):
   ```toml
   routes = [{ pattern = "api.earningsjr.com/*", zone_name = "earningsjr.com" }]
   ```

2. **CORS Origins** (in `workers/api/src/index.ts`):
   - `https://api.earningsjr.com` is included in allowed origins
   - Also allows `earningsjr.com`, `www.earningsjr.com`, and `*.pages.dev`

3. **Frontend Environment Variable**:
   - `VITE_API_BASE=https://api.earningsjr.com`
   - Set in Cloudflare Pages environment variables

### Setting Up the Custom Domain

**⚠️ Important:** The Worker project is named `earningsjr-api` (different from Pages project `earningsjr`)

**In Cloudflare Dashboard:**

1. Go to: **Workers & Pages** → **Workers** (NOT Pages)
2. Click on **`earningsjr-api`** project
3. Go to: **Settings** → **Triggers**
4. Scroll to **Custom Domains** section
5. Click **"Add Custom Domain"**
6. Enter:
   - Domain: `api.earningsjr.com`
   - Zone: `earningsjr.com` (must be managed by Cloudflare)
7. Click **"Add Custom Domain"**
8. Cloudflare will automatically create the DNS record and provision SSL

**DNS Configuration:**
- Cloudflare will create a CNAME or A record automatically
- No manual DNS changes needed if zone is managed by Cloudflare

### Verification

After setup, verify:
- API is accessible at: `https://api.earningsjr.com/healthz`
- CORS works from `earningsjr.com` and `earningsjr.pages.dev`
- Stripe webhook URL: `https://api.earningsjr.com/stripe/webhook`

### Fallback URL

The API is also available at the workers.dev URL:
- `https://earningsjr-api.YOUR_SUBDOMAIN.workers.dev`

But the custom domain (`api.earningsjr.com`) should be used in production.

---

## Frontend Domain

The frontend is deployed to:
- **Production:** `https://earningsjr.com` (custom domain)
- **Preview:** `https://earningsjr.pages.dev` (Cloudflare Pages default)

### Environment Variables

Set in Cloudflare Pages → Settings → Environment Variables:

```
VITE_API_BASE=https://api.earningsjr.com
VITE_SENTRY_DSN=your_sentry_dsn
VITE_POSTHOG_KEY=your_posthog_key
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_PRICE_ID_MONTHLY=price_xxx
VITE_STRIPE_PRICE_ID_ANNUAL=price_xxx
```

---

## Important Notes

1. **Zone Management**: The `earningsjr.com` zone must be managed by Cloudflare for custom domains to work
2. **SSL Certificates**: Cloudflare automatically provisions SSL certificates for custom domains
3. **CORS**: Make sure both frontend and API domains are in the CORS allowlist
4. **Environment Variables**: After adding env vars, redeploy Pages for them to take effect

