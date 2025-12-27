# Resend DNS Records for earningsjr.com

Based on your Resend dashboard, here are the DNS records needed:

## ✅ Already Added (from earlier)
These records are already in your Cloudflare DNS:

1. **DKIM (resend._domainkey)** - ✅ Already exists
   - Type: TXT
   - Name: `resend._domainkey`
   - Content: `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDWNZSEBFLcR6eytlW0Yb5vl7f+jAzNLKphURz91AL0KmLXoVCZqNFP6BPSByHQQXSZ0rVq0NwGlaPF1pKJhIx3q+UPKWTLHuS8tGBKcbmprN4jLrdCY1pm+bIjgTXE7ecrxcZI0VpQcjiA2rrq6wUKwd6jOhwura8MB7nsrb/N8QIDAQAB`

2. **SPF MX Record (send)** - ✅ Already exists
   - Type: MX
   - Name: `send`
   - Content: `feedback-smtp.us-east-1.amazonses.com`
   - Priority: 10

3. **SPF TXT Record (send)** - ✅ Already exists
   - Type: TXT
   - Name: `send`
   - Content: `v=spf1 include:amazonses.com ~all`

## ⚠️ Optional Records (Only if you want to RECEIVE emails)

4. **DMARC Record** (Optional - for email policy)
   - Type: TXT
   - Name: `_dmarc`
   - Content: `v=DMARC1; p=none;`
   - TTL: Auto
   - **Action:** Add this to Cloudflare DNS

5. **Receiving MX Record** (Optional - only if you want to receive emails at earningsjr.com)
   - Type: MX
   - Name: `@`
   - Content: `inbound-smtp.us-east-1.amazonaws.com`
   - Priority: 9
   - **Action:** You already have other MX records for email forwarding, so skip this unless you want to use Resend for receiving

## 🎯 What You Need to Do:

### Option A: Minimum Setup (Sending Only)
**All required DNS records are already added!** ✅

Just update the sender email to use your verified domain:

```bash
cd workers/api
npx wrangler secret put SENDER_EMAIL
# Enter: EarningsJr <noreply@earningsjr.com>
```

### Option B: Add DMARC (Recommended for Better Deliverability)
Add the DMARC record to Cloudflare:
- Type: TXT
- Name: `_dmarc`
- Content: `v=DMARC1; p=none;`
- Proxy: DNS only
- TTL: Auto

## ✅ Next Steps:

1. **Check if domain is verified** in Resend (it should be since records exist)
2. **Update SENDER_EMAIL** to use `@earningsjr.com`
3. **Test production email endpoint**
4. **Switch frontend back to production endpoint**

