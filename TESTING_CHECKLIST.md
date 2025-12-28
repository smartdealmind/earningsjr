# 🧪 Testing Checklist

## Pre-Launch Testing (Complete Before Going Live)

### ✅ **1. Paywall System Testing**

#### Free Tier Limits
- [ ] **Kid Limit Test**
  - Create 2 kids → Should succeed
  - Try to create 3rd kid → Should show error: "Free tier allows up to 2 kids. Upgrade to Premium for unlimited kids."
  - Verify upgrade prompt appears

- [ ] **Chore Limit Test**
  - Create 10 active chores → Should succeed
  - Try to create 11th chore → Should show error: "Free tier allows up to 10 active chores. Upgrade to Premium for unlimited chores."
  - Verify upgrade prompt appears

- [ ] **Goals Access Test**
  - As free tier user, navigate to `/goals`
  - Should see upgrade prompt (not the goals page)
  - Verify "Upgrade to Premium" button works

- [ ] **Achievements Access Test**
  - As free tier user, navigate to `/achievements`
  - Should see upgrade prompt (not the achievements page)
  - Verify "Upgrade to Premium" button works

#### Premium Tier (After Subscription)
- [ ] **Subscription Status Check**
  - Complete Stripe checkout (test mode)
  - Verify webhook stores subscription in database
  - Check `/stripe/subscription` endpoint returns `hasSubscription: true`
  - Verify limits are removed (can create unlimited kids/chores)

- [ ] **Premium Features Access**
  - After subscribing, navigate to `/goals` → Should work
  - Navigate to `/achievements` → Should work
  - Create more than 2 kids → Should work
  - Create more than 10 chores → Should work

---

### ✅ **2. Authentication & Navigation**

#### Login Flow
- [ ] **Parent Login**
  - Login as parent → Should redirect to `/home`
  - Verify profile avatar shows in header
  - Verify logout button is visible

- [ ] **Kid Login**
  - Login as kid → Should redirect to `/kid`
  - Verify kid dashboard shows 3 cards (Goals, Achievements, Chores)

- [ ] **Landing Page Protection**
  - While logged in, try to visit `/` → Should redirect to `/home` (or `/kid` for kids)
  - After logout, visit `/` → Should show landing page

#### "Act As Kid" Flow
- [ ] **Act As Kid Navigation**
  - As parent, go to `/kids` (Balances page)
  - Click "Act As" button next to a kid
  - Should navigate to `/kid` dashboard
  - Should see "🎭 Acting as [Kid Name]" banner
  - Should see kid's chores, not parent view

- [ ] **Act As Kid Actions**
  - While acting as kid, claim a chore → Should work
  - Complete a chore → Should auto-approve (no approval needed)
  - Verify toast shows "Chore completed and auto-approved! Points added."
  - Navigate to `/goals` → Should work (if premium) or show upgrade prompt
  - Navigate to `/achievements` → Should work (if premium) or show upgrade prompt

- [ ] **Switch Back to Parent**
  - Click "← Back to Parent View" in banner
  - Should return to parent view
  - Banner should disappear

---

### ✅ **3. Core Workflows**

#### Parent Workflow (End-to-End)
- [ ] **Signup → Add Kid → Create Chore → Approve → Points**
  1. Register new parent account
  2. Add a kid (with PIN)
  3. Create a chore (assign to kid)
  4. Logout parent
  5. Login as kid (using PIN)
  6. Claim the chore
  7. Submit the chore
  8. Logout kid
  9. Login as parent
  10. Go to Approvals page
  11. Approve the chore
  12. Verify kid's points increased
  13. Check ledger shows the transaction

#### Kid Workflow (End-to-End)
- [ ] **Login → Claim → Submit → Earn Points**
  1. Login as kid (using PIN)
  2. View available chores
  3. Claim a chore
  4. Submit the chore
  5. Wait for parent approval (or use "Act As Kid" to auto-approve)
  6. Verify points added to balance
  7. Check ledger entry

#### "Act As Kid" Workflow (End-to-End)
- [ ] **Parent Acts As Kid → Complete Chores → Auto-Approval**
  1. Parent logs in
  2. Go to `/kids` page
  3. Click "Act As" for a kid
  4. Navigate to `/kid/chores`
  5. Claim a chore
  6. Complete the chore
  7. Verify auto-approval (no approval queue)
  8. Verify points added immediately
  9. Switch back to parent view

---

### ✅ **4. Stripe Integration**

#### Checkout Flow
- [ ] **Test Checkout (Stripe Test Mode)**
  - Go to `/pricing` page
  - Click "Start Free Trial" (Premium)
  - Complete Stripe checkout with test card: `4242 4242 4242 4242`
  - Verify redirect to success page
  - Check Stripe dashboard for successful payment

#### Webhook Testing
- [ ] **Webhook Verification**
  - After checkout, check Stripe webhook logs
  - Verify `checkout.session.completed` event fired
  - Check database: `Family` table should have:
    - `stripe_customer_id` set
    - `stripe_subscription_id` set
    - `subscription_status` = 'active' or 'trialing'
    - `subscription_plan` set

- [ ] **Subscription Status API**
  - Call `/stripe/subscription` endpoint
  - Verify response includes:
    - `hasSubscription: true`
    - `status: 'active'` or `'trialing'`
    - `limits` object with unlimited values

#### Subscription Management
- [ ] **Cancel Subscription**
  - Cancel subscription in Stripe dashboard
  - Verify webhook `customer.subscription.deleted` fires
  - Check database: `subscription_status` = 'canceled'
  - Verify limits are re-applied (2 kids, 10 chores max)

---

### ✅ **5. Mobile Testing**

#### Device Testing
- [ ] **iPhone Safari**
  - Test all major flows
  - Verify bottom tab bar works
  - Check responsive layout

- [ ] **Android Chrome**
  - Test all major flows
  - Verify bottom tab bar works
  - Check responsive layout

#### Mobile-Specific
- [ ] **Bottom Tab Bar**
  - Verify tabs show correctly
  - Verify active state highlighting
  - Test navigation between tabs

- [ ] **Compact Chore Cards**
  - Verify 3-line layout on mobile
  - Check font sizes (16px title, 12px meta, 14px buttons)
  - Verify spacing (12px cards, 12px gap)

- [ ] **Acting As Banner**
  - Verify banner doesn't overlap header
  - Check positioning (top: 64px, height: 48px)
  - Verify "Back" button works

---

### ✅ **6. Cross-Browser Testing**

- [ ] **Chrome** (Desktop)
- [ ] **Firefox** (Desktop)
- [ ] **Safari** (Desktop)
- [ ] **Edge** (Desktop)
- [ ] **Mobile Safari** (iOS)
- [ ] **Mobile Chrome** (Android)

---

### ✅ **7. Error Handling**

#### API Errors
- [ ] **Network Errors**
  - Disconnect internet
  - Try to perform action
  - Verify error message shows

- [ ] **Rate Limiting**
  - Make many rapid requests
  - Verify rate limit error appears

- [ ] **Invalid Data**
  - Submit form with invalid data
  - Verify validation errors show

#### Frontend Errors
- [ ] **Error Boundary**
  - Trigger a React error (if possible)
  - Verify error boundary catches it
  - Verify Sentry receives error

- [ ] **404 Pages**
  - Visit non-existent route
  - Verify proper 404 handling

---

### ✅ **8. Performance**

- [ ] **Page Load Times**
  - Check initial page load < 2 seconds
  - Verify API calls complete quickly

- [ ] **Large Data Sets**
  - Create 10+ chores
  - Verify page still loads quickly
  - Check for any lag

---

### ✅ **9. Security**

- [ ] **Session Management**
  - Login, then close browser
  - Reopen browser
  - Verify still logged in (if within session timeout)

- [ ] **Logout**
  - Logout
  - Try to access protected route
  - Should redirect to login/landing page

- [ ] **CSRF Protection**
  - Verify API uses secure cookies
  - Check CORS settings

---

### ✅ **10. Analytics & Monitoring**

- [ ] **PostHog Events**
  - Check PostHog dashboard
  - Verify events are firing:
    - `pageview`
    - `signup`
    - `chore_created`
    - `chore_completed`

- [ ] **Sentry Errors**
  - Check Sentry dashboard
  - Verify no critical errors
  - Test error reporting (if needed)

---

## 🚨 Critical Paths (Must Work Before Launch)

1. ✅ **Parent can signup and login**
2. ✅ **Parent can add kid and create chore**
3. ✅ **Kid can login and complete chore**
4. ✅ **Parent can approve chore and points are added**
5. ✅ **Paywall limits work (2 kids, 10 chores)**
6. ✅ **Stripe checkout works**
7. ✅ **Webhook stores subscription**
8. ✅ **Premium features unlock after subscription**

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

### Paywall Tests
- Kid Limit: [ ] Pass [ ] Fail
- Chore Limit: [ ] Pass [ ] Fail
- Goals Access: [ ] Pass [ ] Fail
- Achievements Access: [ ] Pass [ ] Fail

### Auth Tests
- Parent Login: [ ] Pass [ ] Fail
- Kid Login: [ ] Pass [ ] Fail
- Act As Kid: [ ] Pass [ ] Fail
- Landing Page Protection: [ ] Pass [ ] Fail

### Stripe Tests
- Checkout: [ ] Pass [ ] Fail
- Webhook: [ ] Pass [ ] Fail
- Subscription Status: [ ] Pass [ ] Fail

### Mobile Tests
- iPhone: [ ] Pass [ ] Fail
- Android: [ ] Pass [ ] Fail

### Issues Found:
1. 
2. 
3. 
```

---

## 🎯 Quick Smoke Test (5 minutes)

Before any major release, run this quick test:

1. [ ] Login as parent
2. [ ] Add a kid
3. [ ] Create a chore
4. [ ] Act as kid
5. [ ] Complete the chore
6. [ ] Verify points added
7. [ ] Logout
8. [ ] Verify landing page shows

If all pass → Safe to deploy! 🚀

