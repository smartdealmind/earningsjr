# Worker Secrets Configuration

## Issue Fixed: Error Code 1042

The Worker was failing because required secrets weren't configured.

## Secrets Added (Placeholders)

✅ **RESEND_API_KEY** - Set to placeholder
✅ **STRIPE_SECRET_KEY** - Set to placeholder (sk_test_placeholder_key)

The Worker should now start successfully!

---

## Update with Real Values

### 1. Resend API Key (for emails)

Get your key from: https://resend.com/api-keys

```bash
cd workers/api
echo "YOUR_ACTUAL_RESEND_KEY" | npx wrangler secret put RESEND_API_KEY
```

### 2. Stripe Secret Key

Get your key from: https://dashboard.stripe.com/test/apikeys

```bash
cd workers/api
echo "sk_test_YOUR_ACTUAL_KEY" | npx wrangler secret put STRIPE_SECRET_KEY
```

### 3. Stripe Webhook Secret (optional but recommended)

After creating webhook at: https://dashboard.stripe.com/test/webhooks

```bash
cd workers/api
echo "whsec_YOUR_WEBHOOK_SECRET" | npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

### 4. Sender Email (optional)

```bash
cd workers/api
echo "EarningsJr <noreply@earningsjr.com>" | npx wrangler secret put SENDER_EMAIL
```

---

## Test the Worker

```bash
# Test health endpoint
curl https://earningsjr-api.thejmgfam.workers.dev/healthz

# Test custom domain (after DNS propagates)
curl https://api.earningsjr.com/healthz
```

**Expected response:**
```json
{
  "ok": true,
  "service": "earningsjr-api",
  "d1": {
    "ok": true,
    "user_version": null,
    "tables_ok": true
  },
  "kv": {
    "ok": true
  }
}
```

---

## Current Status

- ✅ Placeholder secrets added - Worker can start
- ⏳ Waiting for DNS propagation for `api.earningsjr.com`
- ✅ Workers.dev URL should work now
- 🔄 Update secrets with real values when ready

---

## Important

The placeholder keys are sufficient for:
- ✅ Health checks
- ✅ Basic API functionality
- ✅ Testing the setup

But you'll need real keys for:
- ❌ Sending emails (registration, password reset)
- ❌ Stripe payments
- ❌ Production use

Update the secrets when you're ready to test those features!

