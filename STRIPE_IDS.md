# 💳 Stripe Product & Price IDs

## ✅ Created Successfully

### Product
- **Name:** EarningsJr Premium
- **ID:** `prod_TgmLkLe2370sUY`
- **Description:** Unlimited kids, chores, goals, and achievements for families

### Prices

#### Monthly Plan
- **Price:** $9.99/month
- **Price ID:** `price_1SjOmYHy1vP8dbEz0geH4gfI`
- **Interval:** Monthly

#### Yearly Plan
- **Price:** $99.00/year
- **Price ID:** `price_1SjOmZHy1vP8dbEzzIrgRjvG`
- **Interval:** Yearly

---

## 🔑 Next Steps: Add to Secrets

### GitHub Secrets (Frontend)

Go to: https://github.com/smartdealmind/earningsjr/settings/secrets/actions

Add these secrets:

1. **VITE_STRIPE_PRICE_ID_MONTHLY**
   - Value: `price_1SjOmYHy1vP8dbEz0geH4gfI`

2. **VITE_STRIPE_PRICE_ID_YEARLY**
   - Value: `price_1SjOmZHy1vP8dbEzzIrgRjvG`

3. **VITE_STRIPE_PUBLISHABLE_KEY** (if not already set)
   - Get from: https://dashboard.stripe.com/test/apikeys
   - Use the **Publishable key** (starts with `pk_test_`)

### Cloudflare Worker Secrets (Backend)

```bash
cd workers/api

# Add Stripe Secret Key (if not already set)
npx wrangler secret put STRIPE_SECRET_KEY
# Paste your secret key from: https://dashboard.stripe.com/test/apikeys

# Add Webhook Secret (after creating webhook)
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Paste webhook signing secret (starts with whsec_)
```

---

## 🪝 Create Webhook Endpoint

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL:** `https://api.earningsjr.com/stripe/webhook`
4. **Description:** `EarningsJr Production Webhook`
5. **Events to send:**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
6. Click **"Add endpoint"**
7. **Copy the Signing secret** (starts with `whsec_`)
8. Add it to Cloudflare Worker Secrets as `STRIPE_WEBHOOK_SECRET`

---

## ✅ Quick Checklist

- [x] Product created: `prod_TgmLkLe2370sUY`
- [x] Monthly price created: `price_1SjOmYHy1vP8dbEz0geH4gfI`
- [x] Yearly price created: `price_1SjOmZHy1vP8dbEzzIrgRjvG`
- [ ] Add `VITE_STRIPE_PRICE_ID_MONTHLY` to GitHub Secrets
- [ ] Add `VITE_STRIPE_PRICE_ID_YEARLY` to GitHub Secrets
- [ ] Verify `VITE_STRIPE_PUBLISHABLE_KEY` is in GitHub Secrets
- [ ] Verify `STRIPE_SECRET_KEY` is in Cloudflare Worker Secrets
- [ ] Create webhook endpoint in Stripe Dashboard
- [ ] Add `STRIPE_WEBHOOK_SECRET` to Cloudflare Worker Secrets
- [ ] Test checkout flow

---

## 🧪 Test Your Setup

1. Visit: https://earningsjr.com/pricing
2. Click "Start Free Trial"
3. Should open Stripe Checkout
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout
6. Verify subscription is created in database

---

## 📝 Summary

**Product ID:** `prod_TgmLkLe2370sUY`
**Monthly Price ID:** `price_1SjOmYHy1vP8dbEz0geH4gfI`
**Yearly Price ID:** `price_1SjOmZHy1vP8dbEzzIrgRjvG`

All created in **Test Mode**. Switch to Live Mode when ready for production.

