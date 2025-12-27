# 🔄 Rebranding from ChoreCoins to EarningsJr

## ✅ Code Changes Complete

All code references have been updated from "ChoreCoins" to "EarningsJr". 

**What was changed:**
- ✅ Package names (`chorecoins` → `earningsjr`)
- ✅ Worker name (`chorecoins-api` → `earningsjr-api`)
- ✅ Database name (`chorecoins_db` → `earningsjr_db`)
- ✅ R2 bucket name (`chorecoins-assets` → `earningsjr-assets`)
- ✅ All UI text and branding
- ✅ Email templates
- ✅ Domain references
- ✅ API documentation

---

## 🚨 ACTION REQUIRED: Recreate Cloudflare Resources

Since you're rebranding, you should recreate your Cloudflare resources with the new names to keep everything consistent.

### Step 1: Create New D1 Database

**Option A: Via Cloudflare Dashboard**
1. Go to: https://dash.cloudflare.com
2. Workers & Pages → D1
3. Click "Create database"
4. Name: `earningsjr_db`
5. Copy the **Database ID** (you'll need it)

**Option B: Via Wrangler CLI**
```bash
cd workers/api
npx wrangler d1 create earningsjr_db
```

**After creation:**
- Update `wrangler.toml` with the new database ID
- Run migrations: `npx wrangler d1 execute earningsjr_db --file=./migrations/0001_init.sql`

---

### Step 2: Create New R2 Bucket

**Via Cloudflare Dashboard:**
1. Go to: Workers & Pages → R2
2. Click "Create bucket"
3. Name: `earningsjr-assets`
4. Update `wrangler.toml` (bucket name is already updated)

---

### Step 3: Create New KV Namespace (Optional)

**If you want a fresh start:**
1. Go to: Workers & Pages → KV
2. Click "Create a namespace"
3. Name: `earningsjr-sessions`
4. Copy the **Namespace ID**
5. Update `wrangler.toml` with new ID

**OR keep existing KV** (sessions will be preserved):
- Keep the existing KV namespace ID in `wrangler.toml
- No changes needed

---

### Step 4: Create New Worker

**The worker will be created automatically when you deploy:**
```bash
cd workers/api
npx wrangler deploy
```

This will create a new worker named `earningsjr-api` (from `wrangler.toml`).

**After deployment:**
- Your API will be at: `https://api.earningsjr.com` (custom domain)
- Also available at: `https://earningsjr-api.YOUR_SUBDOMAIN.workers.dev` (workers.dev URL)
- CORS origins are already configured in code

---

### Step 5: Create New Pages Project

**Via Cloudflare Dashboard:**
1. Go to: Workers & Pages → Pages
2. Click "Create a project"
3. Project name: `earningsjr`
4. Connect to your Git repo (or upload manually)

**OR via Wrangler CLI:**
```bash
cd apps/web
pnpm build
npx wrangler pages deploy dist --project-name=earningsjr
```

**After deployment:**
- Your site will be at: `https://earningsjr.pages.dev`
- You can add custom domain: `earningsjr.com`

---

### Step 6: Set Up Custom Domain (earningsjr.com)

**In Cloudflare Pages:**
1. Go to your Pages project
2. Settings → Custom domains
3. Click "Set up a custom domain"
4. Enter: `earningsjr.com`
5. Add DNS records as instructed:
   - CNAME: `earningsjr.com` → `earningsjr.pages.dev`
   - CNAME: `www.earningsjr.com` → `earningsjr.pages.dev`

**For API subdomain (optional):**
- Create subdomain: `api.earningsjr.com`
- Point to your Worker via Cloudflare Workers routes

---

### Step 7: Update Environment Variables

**For API Worker (Secrets):**
```bash
cd workers/api
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
```

**For Pages (Environment Variables):**
In Cloudflare Dashboard → Pages → Settings → Environment Variables:
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

### Step 8: Update Stripe Webhook

**In Stripe Dashboard:**
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Edit your existing webhook (or create new)
3. Update URL to: `https://api.earningsjr.com/stripe/webhook`
4. Save

---

### Step 9: Migrate Data (If Needed)

**If you want to keep existing data:**

**Option A: Export/Import D1 Database**
```bash
# Export old database
npx wrangler d1 export chorecoins_db --output=backup.sql

# Import to new database
npx wrangler d1 execute earningsjr_db --file=backup.sql
```

**Option B: Keep Old Database (Quick)**
- Just update `wrangler.toml` to point to existing database
- Change `database_name` but keep the same `database_id`
- This keeps all your data

---

## 📋 Quick Checklist

- [ ] Create new D1 database: `earningsjr_db`
- [ ] Create new R2 bucket: `earningsjr-assets`
- [ ] (Optional) Create new KV namespace
- [ ] Update `wrangler.toml` with new resource IDs
- [ ] Deploy API worker: `npx wrangler deploy`
- [ ] Create Pages project: `earningsjr`
- [ ] Deploy frontend: `npx wrangler pages deploy dist --project-name=earningsjr`
- [ ] Set up custom domain: `earningsjr.com`
- [ ] Update environment variables
- [ ] Update Stripe webhook URL
- [ ] Test everything!

---

## 🎯 Recommended Approach

**For a clean start (recommended):**
1. Create all new resources with `earningsjr` names
2. Run migrations on new database
3. Deploy fresh
4. Test thoroughly

**For keeping existing data:**
1. Keep existing D1 database (just update name in config)
2. Keep existing KV namespace
3. Create new R2 bucket
4. Deploy with new names
5. Data is preserved

---

## ⚠️ Important Notes

- **Database ID must match** in `wrangler.toml` - this is what connects your worker to the database
- **KV Namespace ID must match** - this stores your sessions
- **R2 bucket name** can be changed easily
- **Worker name** comes from `wrangler.toml` `name` field
- **Pages project name** is independent of worker name

---

## 🚀 After Rebranding

Once everything is deployed:
- Your site: `https://earningsjr.com` (or `earningsjr.pages.dev`)
- Your API: `https://api.earningsjr.com`
- All branding: EarningsJr everywhere
- Database: `earningsjr_db`
- Everything consistent! 🎉

---

**Need help?** Check Cloudflare docs:
- D1: https://developers.cloudflare.com/d1/
- Workers: https://developers.cloudflare.com/workers/
- Pages: https://developers.cloudflare.com/pages/

