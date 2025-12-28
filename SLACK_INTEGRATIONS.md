# 🔔 Slack Integrations for Sentry & PostHog

## Overview

Connect Slack to get real-time alerts and analytics from:
- **Sentry** - Error tracking and monitoring
- **PostHog** - Product analytics and user insights

---

## 📊 Sentry → Slack Integration

### Step 1: Create Slack App for Sentry

1. Go to: https://api.slack.com/apps
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Fill in:
   - **App Name:** `EarningsJr Sentry Alerts`
   - **Pick a workspace:** Your Slack workspace
5. Click **"Create App"**

### Step 2: Configure Slack App

1. In your Slack app settings, go to **"OAuth & Permissions"**
2. Under **"Scopes" → "Bot Token Scopes"**, add:
   - `chat:write` - Send messages
   - `chat:write.public` - Send messages to public channels
   - `channels:read` - View basic channel info
   - `groups:read` - View basic private channel info
3. Scroll up and click **"Install to Workspace"**
4. Authorize the app
5. **Copy the "Bot User OAuth Token"** (starts with `xoxb-`)

### Step 3: Add Slack Integration in Sentry

1. Go to: https://sentry.io/settings/earningsjr/integrations/
2. Search for **"Slack"** and click **"Add Integration"**
3. Click **"Add Installation"**
4. Fill in:
   - **Slack Workspace:** Select your workspace
   - **Channel:** Select channel (e.g., `#earningsjr-alerts` or `#engineering`)
   - **Bot Token:** Paste the token from Step 2
5. Click **"Save"**

### Step 4: Configure Alert Rules

1. In Sentry, go to: **Alerts** → **Create Alert Rule**
2. Set up rules like:
   - **When:** An issue is created
   - **If:** The issue level is "error" or "fatal"
   - **Then:** Send to Slack
3. Or use default alert rules

### Step 5: Test Integration

1. In Sentry, go to your project
2. Click **"Test Alerts"** or trigger a test error
3. Check Slack channel - should receive alert

---

## 📈 PostHog → Slack Integration

### Option A: Using PostHog Webhooks (Recommended)

1. Go to: https://app.posthog.com/project/settings/integrations
2. Search for **"Slack"** or **"Webhooks"**
3. Click **"Add Integration"**

### Option B: Using Slack Incoming Webhook

#### Step 1: Create Slack Incoming Webhook

1. Go to: https://api.slack.com/apps
2. Click **"Create New App"** → **"From scratch"**
3. Name: `EarningsJr PostHog Analytics`
4. Go to **"Incoming Webhooks"**
5. Toggle **"Activate Incoming Webhooks"** to ON
6. Click **"Add New Webhook to Workspace"**
7. Select channel (e.g., `#earningsjr-analytics`)
8. Click **"Allow"**
9. **Copy the Webhook URL** (you'll get a unique URL from Slack - save this securely)

#### Step 2: Configure PostHog Webhooks

1. Go to: https://app.posthog.com/project/settings/integrations
2. Click **"Webhooks"** or search for webhook integration
3. Click **"Add Webhook"**
4. Fill in:
   - **Webhook URL:** Paste your Slack webhook URL
   - **Events:** Select events to send:
     - ✅ User signed up
     - ✅ Subscription started
     - ✅ Subscription canceled
     - ✅ Chore completed
     - ✅ Goal achieved
     - ✅ Error occurred
5. Click **"Save"**

#### Step 3: Create Custom PostHog Actions (Optional)

1. Go to: https://app.posthog.com/data-management/actions
2. Create actions for important events
3. Set up alerts for these actions
4. Configure to send to Slack

---

## 🔔 Recommended Slack Channels

Create these channels in your Slack workspace:

1. **`#earningsjr-alerts`** - Critical errors from Sentry
2. **`#earningsjr-analytics`** - Key metrics from PostHog
3. **`#earningsjr-deployments`** - Deployment notifications (optional)

---

## 📋 Quick Setup Checklist

### Sentry → Slack
- [ ] Create Slack app in https://api.slack.com/apps
- [ ] Add bot scopes: `chat:write`, `chat:write.public`
- [ ] Install app to workspace
- [ ] Copy bot token
- [ ] Add Slack integration in Sentry
- [ ] Configure alert rules
- [ ] Test with a test error

### PostHog → Slack
- [ ] Create Slack incoming webhook
- [ ] Copy webhook URL
- [ ] Add webhook in PostHog settings
- [ ] Configure events to send
- [ ] Test with a test event

---

## 🧪 Testing Integrations

### Test Sentry → Slack

1. In Sentry, go to your project
2. Click **"Test Alerts"** or manually trigger an error
3. Check Slack channel - should see alert message

### Test PostHog → Slack

1. In PostHog, go to **Insights** → **Create Insight**
2. Create a test event or use existing data
3. Set up alert/notification
4. Check Slack channel - should see analytics update

---

## 📊 What You'll Get

### From Sentry:
- ⚠️ Error alerts when issues occur
- 📈 Error trends and frequency
- 🔍 Stack traces and context
- 👥 Affected users count
- 🎯 Issue assignments

### From PostHog:
- 📊 Daily/weekly user metrics
- 🎉 Key event notifications (signups, subscriptions)
- 📈 Growth trends
- 🚨 Anomaly alerts
- 💰 Revenue tracking (if configured)

---

## 🎯 Recommended Alert Rules

### Sentry Alerts:
- **Critical:** Any error with level "fatal"
- **High:** Error rate > 10 errors/minute
- **Medium:** New error type detected
- **Low:** Warning-level issues (optional)

### PostHog Alerts:
- **Daily:** User signups count
- **Weekly:** Active users summary
- **Real-time:** New subscription started
- **Real-time:** Subscription canceled
- **Anomaly:** Unusual drop in key metrics

---

## 🆘 Troubleshooting

### Sentry alerts not appearing in Slack?
- ✅ Check bot token is correct
- ✅ Verify bot is added to channel
- ✅ Check alert rules are configured
- ✅ Test with "Test Alerts" button

### PostHog webhooks not working?
- ✅ Verify webhook URL is correct
- ✅ Check webhook is enabled in PostHog
- ✅ Verify events are selected
- ✅ Test webhook URL with curl:
  ```bash
  curl -X POST <your-webhook-url> \
    -H 'Content-Type: application/json' \
    -d '{"text":"Test message"}'
  ```

---

## 🔐 Security Notes

- **Never commit webhook URLs or tokens to git**
- **Use different channels for different environments** (dev/prod)
- **Limit who can see alert channels** (private channels for sensitive errors)
- **Rotate tokens periodically**

---

## 📝 Summary

**Sentry Integration:**
- Uses Slack Bot API
- Requires bot token
- Configured in Sentry settings

**PostHog Integration:**
- Uses Slack Incoming Webhooks
- Requires webhook URL
- Configured in PostHog settings

Both integrations send real-time notifications to your Slack workspace for better monitoring and faster response times.

