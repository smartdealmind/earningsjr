# 🐛 PostHog Error Tracking Setup

## Overview

PostHog has built-in error tracking that captures exceptions from your frontend. This guide helps you configure it properly.

---

## ✅ Step 1: Enable Exception Autocapture

1. Go to: **Settings** → **Exception autocapture** (you're already there!)
2. Toggle **"Enable exception autocapture"** to **ON**
3. This will automatically capture:
   - Frontend JavaScript errors
   - Unhandled promise rejections
   - React errors (if using React)

**Status:** ✅ Enabled (recommended)

---

## 🔇 Step 2: Configure Suppression Rules (Optional)

Filter out noise by suppressing certain exceptions:

1. In **Suppression rules** section, you'll see:
   - **"Ignore exceptions that match"** dropdown (set to "Any")
   - **"+ Add filter"** button

2. Click **"+ Add filter"** to open the filter dialog

3. **Important:** The search field is for typing the actual exception type name, not "Exception type" as a label!

4. Common filters to add:

   **Filter 1: ChunkLoadError**
   - Click **"+ Add filter"**
   - In the search field, type: `ChunkLoadError` (the actual error type name)
   - If it shows "No results", that's okay - you can still type and save it
   - This suppresses chunk loading errors (common in production, usually harmless)

   **Filter 2: ResizeObserver errors**
   - Click **"+ Add filter"** again
   - In the search field, type: `ResizeObserver` or `ResizeObserver loop limit exceeded`
   - This suppresses browser resize observer quirks

   **Filter 3: Third-party script errors**
   - Click **"+ Add filter"**
   - Type: `Script error` or the actual error message text
   - This suppresses external script errors

**Note:** If you see "No results", you can still:
- Type the exception type name directly (like `ChunkLoadError`)
- The filter will work even if it's not in the autocomplete list
- PostHog will match exceptions based on what you type

4. The dropdown **"Ignore exceptions that match"** should be set to:
   - **"Any"** = Suppress if ANY filter matches (recommended)
   - **"All"** = Suppress only if ALL filters match

5. Click **"Save"** button to save the suppression rules

**Important Tips:**
- The search field expects the **actual exception type name** (e.g., `ChunkLoadError`), not "Exception type" as a label
- If you see "No results", you can still type the exception name and it will work
- You might need to wait for errors to be captured first before they appear in autocomplete
- Common exception types to suppress:
  - `ChunkLoadError` - Failed to load JavaScript chunks
  - `ResizeObserver loop limit exceeded` - Browser quirk
  - `Script error` - Third-party script errors
  - `NetworkError` - Network-related errors (optional)

---

## 🔔 Step 3: Set Up Alerts

### Create Alert for Critical Errors

1. Go to: **Alerting** section
2. Click **"Create alert"** or **"new"**
3. Configure:
   - **Name:** `Critical Errors - EarningsJr`
   - **Trigger:** When exception level is `error` or `fatal`
   - **Frequency:** Real-time or daily digest
   - **Destination:** Slack (if connected) or Email

### Recommended Alerts:

#### Alert 1: Critical Errors
- **Name:** Critical Frontend Errors
- **Condition:** Exception level = `error` OR `fatal`
- **Frequency:** Real-time
- **Destination:** Slack channel `#earningsjr-alerts`

#### Alert 2: Error Spike
- **Name:** Error Rate Spike
- **Condition:** More than 10 errors in last 5 minutes
- **Frequency:** Real-time
- **Destination:** Slack channel `#earningsjr-alerts`

#### Alert 3: Daily Error Summary
- **Name:** Daily Error Digest
- **Condition:** Any errors in last 24 hours
- **Frequency:** Daily at 9 AM
- **Destination:** Slack channel `#earningsjr-analytics`

---

## 🔗 Step 4: Connect Slack Integration

### Option A: Direct Slack Integration (If Available)

1. Go to: **Settings** → **Integrations**
2. Look for **"Slack"** integration
3. Click **"Connect"** or **"Add Integration"**
4. Follow the setup wizard
5. Select channels for alerts

### Option B: Using Webhooks (If Direct Integration Not Available)

1. Create Slack incoming webhook (see `SLACK_SETUP_QUICK.md`)
2. In PostHog, go to **Settings** → **Webhooks**
3. Add webhook URL
4. Configure which events to send

---

## 📊 Step 5: Configure Auto Assignment Rules

Automatically assign errors to team members:

1. Go to: **Auto assignment rules**
2. Click **"Add rule"**
3. Example rules:
   - **Condition:** Exception type contains `Stripe`
   - **Action:** Assign to `@your-username`
   - **Condition:** Exception message contains `API`
   - **Action:** Assign to `@your-username`

---

## 🎯 Step 6: Custom Grouping Rules

Group similar errors together:

1. Go to: **Custom grouping rules**
2. Click **"Add rule"**
3. Example:
   - **Property:** `exception.type`
   - **Action:** Group by exception type
   - This helps reduce duplicate issues

---

## 📦 Step 7: Upload Source Maps (Important!)

Source maps help you see readable stack traces instead of minified code.

### For Vite/React Apps:

1. **Build your app** (source maps are generated automatically)
2. PostHog should automatically detect source maps if:
   - You're using `@posthog/js` SDK
   - Source maps are accessible at build time
3. **Verify:** Check **Symbol sets** section - should show your releases

### Manual Upload (If Needed):

```bash
# If PostHog doesn't auto-detect, you can upload manually
# See PostHog docs for your specific build tool
```

---

## 🚀 Step 8: Verify Setup

### Test Error Tracking:

1. Open browser console on your site
2. Run:
   ```javascript
   throw new Error('Test PostHog error tracking');
   ```
3. Check PostHog → **Issues** → Should see the error
4. Check Slack (if connected) → Should receive alert

### Check Current Status:

- ✅ Exception autocapture: **Enabled**
- ✅ Alerts: **Configured** (set up at least one)
- ✅ Slack: **Connected** (if using)
- ✅ Source maps: **Uploaded** (check Symbol sets)

---

## 📋 Quick Setup Checklist

- [ ] Enable exception autocapture
- [ ] Add suppression rules (optional, but recommended)
- [ ] Create at least one alert (critical errors)
- [ ] Connect Slack integration
- [ ] Configure auto assignment rules (optional)
- [ ] Verify source maps are working
- [ ] Test with a test error
- [ ] Check alerts are firing in Slack

---

## 🎯 Recommended Configuration

### Exception Autocapture:
- ✅ **Enabled** - Capture all frontend errors

### Suppression Rules:
- `ChunkLoadError` - Suppress
- `ResizeObserver loop limit exceeded` - Suppress
- Third-party script errors - Suppress

### Alerts:
1. **Critical Errors** - Real-time → Slack `#earningsjr-alerts`
2. **Error Spike** - Real-time → Slack `#earningsjr-alerts`
3. **Daily Digest** - Daily → Slack `#earningsjr-analytics`

### Auto Assignment:
- Stripe errors → Assign to you
- API errors → Assign to you
- Payment errors → Assign to you

---

## 🆘 Troubleshooting

### Errors not showing up?
- ✅ Check exception autocapture is enabled
- ✅ Verify PostHog SDK is initialized in your app
- ✅ Check browser console for PostHog errors
- ✅ Verify `VITE_POSTHOG_KEY` is set correctly

### Alerts not firing?
- ✅ Check alert conditions are correct
- ✅ Verify Slack integration is connected
- ✅ Test with a real error (not suppressed)
- ✅ Check PostHog logs for alert delivery

### Source maps not working?
- ✅ Verify source maps are generated during build
- ✅ Check Symbol sets section for releases
- ✅ Ensure PostHog can access source map files
- ✅ Check build configuration (Vite should generate them automatically)

---

## 📝 Summary

PostHog error tracking is now configured to:
- ✅ Capture frontend exceptions automatically
- ✅ Filter out noise with suppression rules
- ✅ Alert you via Slack when critical errors occur
- ✅ Group similar errors together
- ✅ Show readable stack traces with source maps

You'll get real-time alerts in Slack whenever critical errors occur in production!

