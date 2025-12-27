# 🧪 Testing Guide: "Act As Kid" Feature

## ✅ **Improvements Just Added:**

1. **Better Feedback:**
   - Toast notifications when chores are completed
   - "Auto-approved!" message when parent acts as kid
   - "Will auto-approve" indicator on chore cards

2. **Visual Indicators:**
   - Chore cards show "✓ Will auto-approve when completed" when in "Act As" mode
   - Button text changes from "Submit" to "Complete" when parent acts as kid

3. **Better Ledger Descriptions:**
   - "Chore Completed" instead of "chore_approved"
   - More readable format

---

## 🧪 **TESTING CHECKLIST**

### **Test 1: Basic "Act As" Flow** ⏱️ 5 mins

**Steps:**
1. ✅ Login as parent
2. ✅ Navigate to `/kids` (or Balances tab)
3. ✅ Click "Act As [Kid Name]" button next to a kid
4. ✅ **Expected Results:**
   - Banner appears at top: "🎭 Acting as [Kid Name]"
   - Redirects to `/kid` (kid dashboard)
   - Shows that kid's chores
   - Header is positioned below banner (not overlapping)

**Screenshot this!** 📸

---

### **Test 2: Claim & Complete Chore** ⏱️ 10 mins

**Steps:**
1. ✅ While "Acting as [Kid Name]"
2. ✅ Find an "open" chore
3. ✅ Click "Claim" button
4. ✅ Click "Complete" button (should say "Complete" not "Submit")
5. ✅ **Expected Results:**
   - Toast notification: "Chore completed and auto-approved! Points added."
   - Chore status changes to "approved" (not "submitted")
   - Points immediately added to kid's balance
   - Ledger shows new transaction: "+X pts - Chore Completed"

**Critical Check:** 
- Open browser console (F12) → Network tab
- Look for `/chores/:id/submit` request
- Should return `{ ok: true }` immediately
- Chore should NOT appear in parent's approval queue

---

### **Test 3: View Ledger** ⏱️ 3 mins

**Steps:**
1. ✅ While "Acting as [Kid Name]"
2. ✅ Go back to Balances page (or navigate to `/kids`)
3. ✅ Select the kid you're acting as
4. ✅ View ledger
5. ✅ **Expected Results:**
   - Shows transaction: "+X pts - Chore Completed"
   - Date/time displayed correctly
   - Transaction appears immediately (no refresh needed)

---

### **Test 4: Create Goal as Kid** ⏱️ 5 mins

**Steps:**
1. ✅ While "Acting as [Kid Name]"
2. ✅ Navigate to Goals tab (if available) or use API
3. ✅ Create goal: "Save for bike - $50"
4. ✅ **Expected Results:**
   - Goal created successfully
   - Shows in kid's goals list
   - No approval needed

---

### **Test 5: Switch Back to Parent** ⏱️ 2 mins

**Steps:**
1. ✅ While "Acting as [Kid Name]"
2. ✅ Click "← Back to Parent View" in banner
3. ✅ **Expected Results:**
   - Banner disappears
   - Returns to parent view
   - Can see all kids again
   - Header returns to normal position

---

### **Test 6: Security Check** ⏱️ 5 mins

**Steps:**
1. ✅ Open browser dev tools (F12)
2. ✅ Go to Network tab
3. ✅ Act as a kid
4. ✅ Find a request with `X-Acting-As-Kid-Id` header
5. ✅ Copy the kid ID from header
6. ✅ Try to manually change it to a random UUID
7. ✅ **Expected Results:**
   - Request should fail
   - Error: "wrong_family" or similar
   - Backend validates parent-kid relationship

**How to test:**
```bash
# Get your session cookie first
curl -X POST https://api.earningsjr.com/chores/CHORE_ID/submit \
  -H "Cookie: cc_sess=YOUR_SESSION" \
  -H "X-Acting-As-Kid-Id: RANDOM_UUID" \
  -H "Content-Type: application/json"
```

Should return error.

---

### **Test 7: Mobile Responsive** ⏱️ 3 mins

**Steps:**
1. ✅ Resize browser to 375px width (mobile size)
2. ✅ Test full "Act As" flow
3. ✅ **Check:**
   - Banner doesn't overlap content
   - Buttons are tappable (not too small)
   - All text readable
   - Bottom nav still works

---

### **Test 8: Multiple Tabs** ⏱️ 3 mins

**Steps:**
1. ✅ Tab 1: Act as Emma
2. ✅ Tab 2: Act as Jack (or open new tab)
3. ✅ Go back to Tab 1
4. ✅ **Expected Results:**
   - Tab 1 still shows "Acting as Emma"
   - Tab 2 can have different kid (or parent view)
   - sessionStorage is tab-specific (correct behavior)

---

## 🐛 **KNOWN ISSUES TO WATCH:**

### **Issue 1: Banner Overlapping**
**Symptom:** Content hidden behind banner

**Fix if needed:**
- Check `Shell.tsx` - banner height should be 56px
- Header should be positioned at `top: 56px` when banner visible
- Main content padding should account for banner

### **Issue 2: Chore Status Not Updating**
**Symptom:** After completing chore, still shows "claimed" or "open"

**Fix if needed:**
- Check `KidDashboard.tsx` - `load()` should be called after submit
- Check API response - should return `{ ok: true }`

### **Issue 3: Points Not Adding**
**Symptom:** Chore completes but points don't increase

**Fix if needed:**
- Check backend logs for auto-approval logic
- Verify `is_required === 0` (required chores don't give points)
- Check ledger entry was created

---

## 📊 **REPORT FORMAT:**

```
Test 1: Basic Flow
Status: ✅ PASS / ❌ FAIL
Notes: [What happened]
Screenshot: [Attach]

Test 2: Chore Completion
Status: ✅ PASS / ❌ FAIL
Notes: [Did it auto-approve? Points added?]
Console Errors: [Any errors?]

Test 3: Mobile
Status: ✅ PASS / ❌ FAIL
Notes: [Layout issues?]

Test 4: Security
Status: ✅ PASS / ❌ FAIL
Notes: [Could you bypass validation?]
```

---

## 🚀 **QUICK START:**

1. **Start dev servers:**
   ```bash
   # Terminal 1: Frontend
   cd apps/web && pnpm dev
   
   # Terminal 2: Backend
   cd workers/api && pnpm dev
   ```

2. **Login as parent:**
   - Go to http://localhost:5173
   - Login with parent credentials

3. **Test "Act As" flow:**
   - Navigate to Kids/Balances page
   - Click "Act As" button
   - Complete a chore
   - Verify auto-approval

---

## ✅ **SUCCESS CRITERIA:**

- ✅ Parent can act as kid
- ✅ Chores auto-approve when parent acts as kid
- ✅ Points add immediately
- ✅ Ledger shows transactions
- ✅ Security: Can't act as other families' kids
- ✅ Mobile responsive
- ✅ Banner doesn't break layout

---

**Ready to test!** 🧪

Start with Test 1 and work through systematically. Report any issues you find!

