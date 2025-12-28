# 💳 Stripe Setup Guide

## Overview

EarningsJr uses Stripe for subscription payments. You need to:
1. Create **1 Product** (Premium)
2. Create **2 Prices** (Monthly and Yearly)
3. Set up **1 Webhook** endpoint
4. Configure secrets in GitHub and Cloudflare

---

## 📦 Step 1: Create Stripe Product

You need **1 product** called "Premium" with **2 prices** (monthly and yearly).

### Option A: Using Stripe Dashboard (Recommended)

1. Go to: https://dashboard.stripe.com/test/products
2. Click **"Add product"**
3. Fill in:
   - **Name:** `EarningsJr Premium`
   - **Description:** `Unlimited kids, chores, goals, and achievements for families`
   - **Pricing model:** `Standard pricing`
4. Click **"Save product"**

### Option B: Using Stripe CLI

```bash
# Install Stripe CLI if you haven't: https://stripe.com/docs/stripe-cli
stripe login

# Create the product
stripe products create \
  --name="EarningsJr Premium" \
  --description="Unlimited kids, chores, goals, and achievements for families"
```

**Save the Product ID** (starts with `prod_`) - you'll need it for creating prices.

---

## 💰 Step 2: Create Prices

Create **2 prices** for the Premium product:

### Monthly Price ($9.99/month)

**Using Dashboard:**
1. Go to your product → Click **"Add price"**
2. Fill in:
   - **Price:** `9.99`
   - **Currency:** `USD`
   - **Billing period:** `Monthly`
   - **Recurring:** ✅ Yes
3. Click **"Add price"**

**Using CLI:**
```bash
stripe prices create \
  --product=prod_XXXXX \
  --unit-amount=999 \
  --currency=usd \
  --recurring[interval]=month
```

**Save the Monthly Price ID** (starts with `price_`)

### Yearly Price ($99/year)

**Using Dashboard:**
1. Go to your product → Click **"Add price"** again
2. Fill in:
   - **Price:** `99.00`
   - **Currency:** `USD`
   - **Billing period:** `Yearly`
   - **Recurring:** ✅ Yes
3. Click **"Add price"**

**Using CLI:**
```bash
stripe prices create \
  --product=prod_XXXXX \
  --unit-amount=9900 \
  --currency=usd \
  --recurring[interval]=year
```

**Save the Yearly Price ID** (starts with `price_`)

---

## 🔑 Step 3: Get API Keys

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

---

## 🔐 Step 4: Configure Secrets

### Frontend (GitHub Secrets)

1. Go to: https://github.com/smartdealmind/earningsjr/settings/secrets/actions
2. Add these secrets:

| Secret Name | Value | Example |
|------------|-------|---------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your publishable key | `pk_test_51...` |
| `VITE_STRIPE_PRICE_ID_MONTHLY` | Monthly price ID | `price_1...` |
| `VITE_STRIPE_PRICE_ID_YEARLY` | Yearly price ID | `price_1...` |

### Backend (Cloudflare Worker Secrets)

```bash
cd workers/api
npx wrangler secret put STRIPE_SECRET_KEY
# Paste your secret key when prompted
```

Or via Dashboard:
1. Go to: https://dash.cloudflare.com
2. Workers & Pages → `earningsjr-api` → Settings → Variables and Secrets
3. Add secret: `STRIPE_SECRET_KEY` = Your secret key

---

## 🪝 Step 5: Create Webhook Endpoint

### Option A: Using Stripe CLI (For Testing)

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login

# Forward webhooks to local development
stripe listen --forward-to localhost:8787/stripe/webhook

# This will give you a webhook signing secret (starts with whsec_)
# Save this for local testing
```

### Option B: Using Stripe Dashboard (For Production)

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Fill in:
   - **Endpoint URL:** `https://api.earningsjr.com/stripe/webhook`
   - **Description:** `EarningsJr Production Webhook`
   - **Events to send:** Select these events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. Click **"Add endpoint"**
5. **Copy the Signing secret** (starts with `whsec_`)

### Add Webhook Secret to Cloudflare

```bash
cd workers/api
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste the webhook signing secret when prompted
```

Or via Dashboard:
1. Go to: https://dash.cloudflare.com
2. Workers & Pages → `earningsjr-api` → Settings → Variables and Secrets
3. Add secret: `STRIPE_WEBHOOK_SECRET` = Your webhook signing secret

---

## ✅ Step 6: Verify Setup

### Test Frontend

1. Check GitHub Actions build logs - should see `VITE_STRIPE_PUBLISHABLE_KEY` being used
2. Visit https://earningsjr.com/pricing
3. Should NOT see Stripe error in console
4. Click "Start Free Trial" - should open Stripe checkout

### Test Backend

```bash
# Test checkout creation
curl -X POST https://api.earningsjr.com/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: cc_sess=YOUR_SESSION_TOKEN" \
  -d '{"priceId": "price_YOUR_MONTHLY_PRICE_ID"}'
```

### Test Webhook

1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select `checkout.session.completed`
5. Check Cloudflare Worker logs: `npx wrangler tail`
6. Should see webhook being processed

---

## 📋 Complete Checklist

### Stripe Dashboard
- [ ] Created product: "EarningsJr Premium"
- [ ] Created monthly price: $9.99/month
- [ ] Created yearly price: $99/year
- [ ] Copied publishable key
- [ ] Copied secret key
- [ ] Created webhook endpoint
- [ ] Copied webhook signing secret

### GitHub Secrets
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` ✅
- [ ] `VITE_STRIPE_PRICE_ID_MONTHLY` ⚠️ **Need to add**
- [ ] `VITE_STRIPE_PRICE_ID_YEARLY` ⚠️ **Need to add**

### Cloudflare Worker Secrets
- [ ] `STRIPE_SECRET_KEY` ✅ (if already set)
- [ ] `STRIPE_WEBHOOK_SECRET` ✅ (if already set)

---

## 🚀 Quick Setup Commands

```bash
# 1. Create product (save the product ID)
stripe products create \
  --name="EarningsJr Premium" \
  --description="Unlimited kids, chores, goals, and achievements"

# 2. Create monthly price (save the price ID)
stripe prices create \
  --product=prod_XXXXX \
  --unit-amount=999 \
  --currency=usd \
  --recurring[interval]=month

# 3. Create yearly price (save the price ID)
stripe prices create \
  --product=prod_XXXXX \
  --unit-amount=9900 \
  --currency=usd \
  --recurring[interval]=year

# 4. Add secrets to Cloudflare
cd workers/api
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

---

## 🧪 Testing

### Test Mode vs Live Mode

- **Test Mode:** Use `pk_test_` and `sk_test_` keys
- **Live Mode:** Use `pk_live_` and `sk_live_` keys (when ready for production)

### Test Cards

Use these test cards in Stripe Checkout:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

### Test Webhook Events

1. Complete a test checkout
2. Check webhook logs in Stripe Dashboard
3. Verify database updated (subscription_status = 'active')

---

## 🆘 Troubleshooting

**Stripe error: "Please call Stripe() with your publishable key"**
- ✅ Check `VITE_STRIPE_PUBLISHABLE_KEY` is set in GitHub Secrets
- ✅ Check it's being used in build (check GitHub Actions logs)
- ✅ Redeploy Pages after adding secret

**CORS errors when calling API**
- ✅ Check CORS middleware is working
- ✅ Verify origin is in `ALLOWED_ORIGINS`
- ✅ Check Worker logs for CORS issues

**Webhook not receiving events**
- ✅ Check webhook URL is correct: `https://api.earningsjr.com/stripe/webhook`
- ✅ Verify `STRIPE_WEBHOOK_SECRET` is set in Cloudflare
- ✅ Check webhook events are selected in Stripe Dashboard
- ✅ Check Worker logs: `npx wrangler tail`

**Checkout not working**
- ✅ Verify price IDs are correct
- ✅ Check `STRIPE_SECRET_KEY` is set in Cloudflare
- ✅ Test with Stripe test cards
- ✅ Check browser console for errors

---

## 📝 Summary

**Products needed:** 1 (Premium)
**Prices needed:** 2 (Monthly $9.99, Yearly $99)
**Webhooks needed:** 1 (Production endpoint)
**Secrets needed:** 5 total
  - GitHub: 3 (`VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_STRIPE_PRICE_ID_MONTHLY`, `VITE_STRIPE_PRICE_ID_YEARLY`)
  - Cloudflare: 2 (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)

