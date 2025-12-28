# 🪝 Stripe Webhook Setup

## Quick Setup Command

### For Production (Cloudflare Worker)

```bash
# 1. Create webhook endpoint in Stripe Dashboard
# Go to: https://dashboard.stripe.com/test/webhooks
# Click "Add endpoint"
# URL: https://api.earningsjr.com/stripe/webhook
# Events: Select all subscription-related events

# 2. Copy the webhook signing secret (starts with whsec_)

# 3. Add to Cloudflare Worker
cd workers/api
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste the webhook signing secret when prompted
```

### For Local Testing (Stripe CLI)

```bash
# Install Stripe CLI if needed
# macOS: brew install stripe/stripe-cli/stripe
# Linux: See https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local Worker
stripe listen --forward-to localhost:8787/stripe/webhook

# This will output a webhook signing secret (whsec_...)
# Use this for local testing only
```

---

## 📋 Step-by-Step: Production Webhook

### Step 1: Create Webhook Endpoint in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Fill in:
   - **Endpoint URL:** `https://api.earningsjr.com/stripe/webhook`
   - **Description:** `EarningsJr Production Webhook`
   - **Version:** `Latest API version` (or `2024-12-18.acacia` to match code)
4. Under **"Events to send"**, select:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Click **"Add endpoint"**

### Step 2: Copy Webhook Signing Secret

1. After creating the endpoint, you'll see a **"Signing secret"**
2. It starts with `whsec_`
3. **Copy this secret** - you'll need it for Step 3

### Step 3: Add Secret to Cloudflare Worker

**Option A: Using Wrangler CLI (Recommended)**

```bash
cd workers/api
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

When prompted, paste the webhook signing secret.

**Option B: Using Cloudflare Dashboard**

1. Go to: https://dash.cloudflare.com
2. Workers & Pages → `earningsjr-api`
3. Settings → Variables and Secrets
4. Under "Secrets", click "Add secret" (or edit existing)
5. Name: `STRIPE_WEBHOOK_SECRET`
6. Value: Paste the webhook signing secret
7. Click "Save"

### Step 4: Verify Webhook is Working

1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select `checkout.session.completed`
5. Check Cloudflare Worker logs:
   ```bash
   cd workers/api
   npx wrangler tail
   ```
6. You should see the webhook being processed

---

## 🧪 Testing Webhooks Locally

### Using Stripe CLI

```bash
# 1. Start your local Worker
cd workers/api
pnpm dev

# 2. In another terminal, forward webhooks
stripe listen --forward-to localhost:8787/stripe/webhook

# 3. Trigger a test event
stripe trigger checkout.session.completed
```

### Test Events

```bash
# Test checkout completion
stripe trigger checkout.session.completed

# Test subscription creation
stripe trigger customer.subscription.created

# Test subscription update
stripe trigger customer.subscription.updated

# Test subscription deletion
stripe trigger customer.subscription.deleted
```

---

## 🔍 Monitoring Webhooks

### View Webhook Logs in Stripe

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. View **"Recent deliveries"** to see:
   - Success/failure status
   - Response codes
   - Request/response payloads

### View Worker Logs

```bash
cd workers/api
npx wrangler tail
```

This shows real-time logs from your Worker, including webhook processing.

---

## 🆘 Troubleshooting

### Webhook Not Receiving Events

**Check:**
- ✅ Webhook URL is correct: `https://api.earningsjr.com/stripe/webhook`
- ✅ Webhook is enabled in Stripe Dashboard
- ✅ Correct events are selected
- ✅ Worker is deployed and running

### Webhook Signature Verification Failing

**Check:**
- ✅ `STRIPE_WEBHOOK_SECRET` is set in Cloudflare Worker Secrets
- ✅ Secret matches the one in Stripe Dashboard
- ✅ Using correct API version (check `workers/api/src/index.ts`)

### Webhook Returns 500 Error

**Check:**
- ✅ Worker logs: `npx wrangler tail`
- ✅ Database connection is working
- ✅ All required secrets are set
- ✅ Check Sentry for error details

### Test Webhook Works But Real Events Don't

**Check:**
- ✅ You're testing in the correct Stripe mode (test vs live)
- ✅ Webhook endpoint is in the correct environment
- ✅ Events are actually being triggered (check Stripe Dashboard)

---

## 📝 Webhook Events Handled

The Worker handles these events:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create/update subscription in database |
| `customer.subscription.created` | Update subscription status |
| `customer.subscription.updated` | Update subscription details |
| `customer.subscription.deleted` | Mark subscription as canceled |
| `invoice.payment_succeeded` | Confirm subscription is active |
| `invoice.payment_failed` | Mark subscription as past_due |

---

## ✅ Quick Checklist

- [ ] Created webhook endpoint in Stripe Dashboard
- [ ] Set endpoint URL: `https://api.earningsjr.com/stripe/webhook`
- [ ] Selected all required events
- [ ] Copied webhook signing secret
- [ ] Added `STRIPE_WEBHOOK_SECRET` to Cloudflare Worker Secrets
- [ ] Tested webhook with test event
- [ ] Verified webhook appears in Worker logs
- [ ] Verified database is updated correctly

---

## 🚀 Production Checklist

Before going live:

- [ ] Switch to **Live mode** in Stripe Dashboard
- [ ] Create webhook endpoint in **Live mode** (not test mode)
- [ ] Update `STRIPE_SECRET_KEY` to live key in Cloudflare
- [ ] Update `VITE_STRIPE_PUBLISHABLE_KEY` to live key in GitHub
- [ ] Test with real payment (small amount)
- [ ] Verify webhook processes real events
- [ ] Monitor webhook success rate in Stripe Dashboard

