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

### Webhook Endpoint
- **ID:** `we_1SjOoEHy1vP8dbEzoosj9GW3`
- **URL:** `https://api.earningsjr.com/stripe/webhook`
- **Secret:** `whsec_NP4buZPvXx9p0V4UySExwBYMBXE6Yi83`
- **Status:** Enabled
- **Events:**
  - ✅ `checkout.session.completed`
  - ✅ `customer.subscription.created`
  - ✅ `customer.subscription.updated`
  - ✅ `customer.subscription.deleted`
  - ✅ `invoice.payment_succeeded`
  - ✅ `invoice.payment_failed`

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

# Add Webhook Secret (already created above)
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# Value: whsec_NP4buZPvXx9p0V4UySExwBYMBXE6Yi83
```

---

## ✅ Quick Checklist

- [x] Product created: `prod_TgmLkLe2370sUY`
- [x] Monthly price created: `price_1SjOmYHy1vP8dbEz0geH4gfI`
- [x] Yearly price created: `price_1SjOmZHy1vP8dbEzzIrgRjvG`
- [x] Webhook endpoint created: `we_1SjOoEHy1vP8dbEzoosj9GW3`
- [ ] Add `VITE_STRIPE_PRICE_ID_MONTHLY` to GitHub Secrets
- [ ] Add `VITE_STRIPE_PRICE_ID_YEARLY` to GitHub Secrets
- [ ] Verify `VITE_STRIPE_PUBLISHABLE_KEY` is in GitHub Secrets
- [ ] Verify `STRIPE_SECRET_KEY` is in Cloudflare Worker Secrets
- [ ] Add `STRIPE_WEBHOOK_SECRET` to Cloudflare Worker Secrets (use value above)
- [ ] Test checkout flow

---

## 🧪 Test Your Setup

1. Visit: https://earningsjr.com/pricing
2. Click "Start Free Trial"
3. Should open Stripe Checkout
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout
6. Verify subscription is created in database
7. Check webhook logs in Stripe Dashboard

---

## 📝 Summary

**Product ID:** `prod_TgmLkLe2370sUY`
**Monthly Price ID:** `price_1SjOmYHy1vP8dbEz0geH4gfI`
**Yearly Price ID:** `price_1SjOmZHy1vP8dbEzzIrgRjvG`
**Webhook ID:** `we_1SjOoEHy1vP8dbEzoosj9GW3`
**Webhook Secret:** `whsec_NP4buZPvXx9p0V4UySExwBYMBXE6Yi83`

All created in **Test Mode**. Switch to Live Mode when ready for production.
