# 🔍 Monitoring & Debugging Guide

## Quick Reference

### 1. **Cloudflare Workers Logs (API Backend)** ⚡

**Real-time tail (live logs):**
```bash
cd workers/api
npx wrangler tail earningsjr-api
```

**Filter by method/status:**
```bash
# Only errors
npx wrangler tail earningsjr-api --status error

# Only POST requests
npx wrangler tail earningsjr-api --method POST

# Search for specific text
npx wrangler tail earningsjr-api | grep "subscription"
```

**View logs in Cloudflare Dashboard:**
1. Go to: https://dash.cloudflare.com
2. Workers & Pages → `earningsjr-api`
3. Click "Logs" tab
4. Filter by time, status, method, etc.

---

### 2. **Browser Console (Frontend)** 🌐

**Open DevTools:**
- **Chrome/Edge:** `Cmd+Option+J` (Mac) or `Ctrl+Shift+J` (Windows)
- **Firefox:** `Cmd+Option+K` (Mac) or `Ctrl+Shift+K` (Windows)
- **Safari:** `Cmd+Option+C` (Mac, enable Developer menu first)

**Check for errors:**
- Look for red errors in Console tab
- Check Network tab for failed API calls
- Check Application tab for localStorage/sessionStorage

**Filter console logs:**
```javascript
// In browser console, filter by:
console.log('API call:', data)  // Shows in console
console.error('Error:', error)  // Shows as error
console.warn('Warning:', msg)   // Shows as warning
```

---

### 3. **Sentry Error Tracking** 🐛

**View errors:**
1. Go to: https://sentry.io
2. Navigate to your project (`earningsjr-web` or `earningsjr-api`)
3. Click "Issues" to see all errors
4. Click on an error to see:
   - Stack trace
   - User context
   - Browser/device info
   - Breadcrumbs (user actions before error)

**Test Sentry:**
```javascript
// In browser console on your site:
Sentry.captureException(new Error('Test error'))
```

**View in code:**
- Frontend: `apps/web/src/main.tsx` (Sentry.init)
- Errors auto-captured by ErrorBoundary

---

### 4. **PostHog Analytics** 📊

**View analytics:**
1. Go to: https://app.posthog.com
2. Navigate to your project
3. Check:
   - **Events** - User actions (signups, clicks, etc.)
   - **Insights** - Custom charts
   - **Session Replay** - Watch user sessions

**Common events to check:**
- `pageview` - Page visits
- `signup` - User registrations
- `chore_created` - Chores created
- `chore_completed` - Chores completed

---

### 5. **Cloudflare Pages Logs (Frontend)** 📄

**View build logs:**
1. Go to: https://dash.cloudflare.com
2. Workers & Pages → `earningsjr` (Pages project)
3. Click "Deployments" tab
4. Click on a deployment to see build logs

**View runtime errors:**
- Check browser console (see #2 above)
- Check Sentry (see #3 above)

---

### 6. **Database Queries (D1)** 💾

**Query database:**
```bash
cd workers/api

# Execute SQL query
npx wrangler d1 execute earningsjr_db --command "SELECT * FROM User LIMIT 5;" --remote

# View all tables
npx wrangler d1 execute earningsjr_db --command ".tables" --remote

# Check specific data
npx wrangler d1 execute earningsjr_db --command "SELECT * FROM Family WHERE subscription_status='active';" --remote
```

---

## 🚨 Common Debugging Scenarios

### **API returning 500 error:**
```bash
# 1. Tail the Worker logs
npx wrangler tail earningsjr-api

# 2. Check Sentry for error details
# 3. Check browser Network tab for request/response
```

### **Frontend not loading:**
```bash
# 1. Check browser console for errors
# 2. Check Sentry for frontend errors
# 3. Check Cloudflare Pages deployment logs
# 4. Verify environment variables are set
```

### **Subscription not working:**
```bash
# 1. Check Stripe webhook logs:
#    - Go to Stripe Dashboard → Webhooks
#    - Click on your webhook endpoint
#    - View "Recent deliveries"

# 2. Check Worker logs for webhook events:
npx wrangler tail earningsjr-api | grep "webhook"

# 3. Check database for subscription status:
npx wrangler d1 execute earningsjr_db --command "SELECT * FROM Family WHERE stripe_subscription_id IS NOT NULL;" --remote
```

### **Email not sending:**
```bash
# 1. Check Resend logs:
#    - Go to https://resend.com/emails
#    - View recent emails and errors

# 2. Check Worker logs:
npx wrangler tail earningsjr-api | grep "email"

# 3. Verify SENDER_EMAIL secret is set:
npx wrangler secret list earningsjr-api
```

---

## 📝 Adding Custom Logs

### **In Worker (Backend):**
```typescript
// In workers/api/src/index.ts
console.log('User logged in:', userId);
console.error('Payment failed:', error);
console.warn('Rate limit approaching:', count);
```

### **In Frontend:**
```typescript
// In apps/web/src/...
console.log('Component mounted');
console.error('API error:', error);

// Or use Sentry directly:
import * as Sentry from '@sentry/react';
Sentry.captureMessage('Custom event', 'info');
```

---

## 🔗 Quick Links

- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Sentry:** https://sentry.io
- **PostHog:** https://app.posthog.com
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Resend:** https://resend.com/emails

---

## 💡 Pro Tips

1. **Keep tail running:** Leave `wrangler tail` running in a terminal while testing
2. **Use filters:** Filter logs by status, method, or search term
3. **Check Sentry first:** Most errors are automatically captured there
4. **Browser DevTools:** Always check Network tab for failed API calls
5. **Test in incognito:** Clear cache/cookies to test fresh sessions

---

## 🆘 Emergency Debugging

**Site is down:**
```bash
# 1. Check Cloudflare status
curl https://api.earningsjr.com/healthz

# 2. Check Worker logs
npx wrangler tail earningsjr-api

# 3. Check Pages deployment
# Go to Cloudflare Dashboard → Pages → Deployments
```

**Database issues:**
```bash
# Check database connection
npx wrangler d1 execute earningsjr_db --command "SELECT 1;" --remote

# Check table structure
npx wrangler d1 execute earningsjr_db --command ".schema User" --remote
```

