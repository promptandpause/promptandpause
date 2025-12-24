# Test Flows & User Journeys

**Last Updated:** 2025-01-07  
**Purpose:** Complete testing guide for Prompt & Pause

---

## 🎯 Overview

This document outlines all critical user flows to test before deployment. Each flow includes step-by-step instructions, expected results, and potential issues to watch for.

---

## ✅ Pre-Testing Checklist

Before testing, ensure:
- [ ] Development server running: `npm run dev`
- [ ] Database accessible (Supabase)
- [ ] All environment variables set (`.env.local`)
- [ ] Test accounts prepared (Google OAuth account, test email)
- [ ] Stripe in test mode with test cards
- [ ] Browser console open for error monitoring

---

## 📋 Critical User Flows

### Flow 1: New User Signup & Onboarding

**Goal:** Test complete new user journey from signup to first reflection

**Prerequisites:**
- New Google account or test account not yet registered
- Clear browser cookies/use incognito

**Steps:**

1. **Navigate to Landing Page**
   - Go to `http://localhost:3000`
   - Expected: Landing/homepage displays correctly
   - Check: Hero section, features, CTA buttons

2. **Click Sign Up**
   - Click "Get Started" or "Sign Up" button
   - Expected: Redirect to `/auth/signup`
   - Check: Page renders without errors

3. **Sign Up with Google OAuth**
   - Click "Continue with Google" button
   - Select/sign in with Google account
   - Expected: OAuth flow completes, redirect to callback
   - Check: No console errors during OAuth

4. **Auth Callback Processing**
   - Automatic redirect after OAuth
   - Expected: 
     - Welcome email sent (check inbox)
     - Redirect to `/onboarding`
   - Check: 
     - Email received within 30 seconds
     - No error messages
     - Profile created in database

5. **Complete Onboarding - Step 1: Disclaimer**
   - Read terms and click "I Understand & Accept"
   - Expected: Move to next step
   - Check: Progress bar shows step 0/4

6. **Complete Onboarding - Step 2: Reason**
   - Select reason for using app (e.g., "Improve mental health")
   - Click "Continue"
   - Expected: Move to mood step
   - Check: Selection is highlighted

7. **Complete Onboarding - Step 3: Mood**
   - Move slider to select current mood (1-10)
   - Click "Continue"
   - Expected: Move to prompt time step
   - Check: Slider value updates correctly

8. **Complete Onboarding - Step 4: Prompt Time**
   - Select preferred prompt time (e.g., "9am")
   - Click "Continue"
   - Expected: Move to delivery method step
   - Check: Selection is highlighted

9. **Complete Onboarding - Step 5: Delivery Method**
   - Select "Email" or "Slack"
   - Click "Continue"
   - Expected: Move to focus areas step
   - Check: Selection is highlighted

10. **Complete Onboarding - Step 6: Focus Areas**
    - Select multiple focus areas (e.g., "Gratitude", "Mindfulness")
    - Click "Complete Onboarding"
    - Expected: 
      - Save to database
      - Show success animation
      - Redirect to `/dashboard` after 2 seconds
    - Check: 
      - No errors in console
      - Preferences saved to `user_preferences` table

11. **Verify Dashboard Load**
    - Automatic redirect to dashboard
    - Expected:
      - User name displays correctly
      - Subscription tier shows "Freemium"
      - Today's prompt generated and displayed
      - Quick stats show 0 reflections
      - Activity calendar empty
    - Check:
      - No loading errors
      - All components render

**Expected Outcomes:**
✅ User account created  
✅ Welcome email received  
✅ Onboarding completed  
✅ Preferences saved  
✅ Dashboard accessible  
✅ Profile in database  

**Common Issues:**
- OAuth redirect fails → Check callback URL in Supabase dashboard
- Email not received → Check Resend API key, check spam folder
- Onboarding stuck → Check browser console for errors
- Dashboard not loading → Check authentication state

---

### Flow 2: Create First Reflection

**Goal:** Test reflection creation flow from prompt to saving

**Prerequisites:**
- Signed in user
- On dashboard with today's prompt

**Steps:**

1. **View Today's Prompt**
   - Navigate to `/dashboard`
   - Expected: Today's prompt card displays with prompt text
   - Check: Prompt is readable and makes sense

2. **Click Write Reflection**
   - Click "Write Reflection" or "Start Writing" button
   - Expected: Textarea expands or modal opens
   - Check: Focus moves to textarea

3. **Write Reflection Text**
   - Type reflection (at least 50 words for testing)
   - Example: "Today I'm feeling grateful for the beautiful weather. It reminded me to slow down and appreciate the small things in life. I realized that happiness often comes from simple moments..."
   - Expected: Text appears as you type, word count updates
   - Check: No lag or input delay

4. **Select Mood**
   - Choose mood emoji (e.g., 😊)
   - Expected: Mood selected and highlighted
   - Check: Only one mood can be selected

5. **Add Tags**
   - Type tags (e.g., "gratitude", "mindfulness", "joy")
   - Press Enter after each tag
   - Expected: Tags display as badges
   - Check: Can add multiple tags, can remove tags

6. **Save Reflection**
   - Click "Save Reflection" button
   - Expected:
     - Loading state shows briefly
     - Success toast notification
     - Redirect to dashboard or reflection saved
     - Word count calculated
   - Check:
     - No errors in console
     - Database updated (check `reflections` table)

7. **Verify Reflection Saved**
   - Check dashboard quick stats
   - Expected: Total reflections increased to 1
   - Check: Current streak shows 1 day

8. **View in Archive**
   - Navigate to `/dashboard/archive`
   - Expected: New reflection appears in list
   - Check:
     - Date is today
     - Mood emoji displays
     - Tags display
     - Reflection text truncated with "Read more"

**Expected Outcomes:**
✅ Reflection created  
✅ Saved to database  
✅ Stats updated  
✅ Appears in archive  

**Common Issues:**
- Save button disabled → Check if all required fields filled
- Reflection not saving → Check API route, database connection
- Stats not updating → Check analytics service, refresh page
- Tags not working → Check tag input handler

---

### Flow 3: Daily Prompt Generation

**Goal:** Test AI prompt generation with context

**Prerequisites:**
- Signed in user
- At least 1 previous reflection saved

**Steps:**

1. **Navigate to Dashboard**
   - Go to `/dashboard`
   - Expected: Current prompt displays
   - Check: Prompt is contextual to user's history

2. **Generate New Prompt**
   - Click "Generate New Prompt" or refresh button
   - Expected:
     - Loading state shows
     - New prompt generated within 3-5 seconds
     - Prompt saved to `prompts_history` table
   - Check:
     - Prompt is different from previous
     - Prompt is relevant and thoughtful
     - No error messages

3. **Verify Prompt Context**
   - Check if prompt relates to:
     - User's focus areas (from onboarding)
     - Previous reflection topics
     - Current mood trends
   - Expected: Prompt shows personalization
   - Check: Not generic/repeated prompts

**Expected Outcomes:**
✅ Prompt generated successfully  
✅ Contextual to user's history  
✅ Saved to database  

**Common Issues:**
- Prompt generation fails → Check AI API key (Groq/OpenAI)
- Generic prompts → Check context being sent to AI
- Slow generation → Check AI API response time

---

### Flow 4: Archive & Search

**Goal:** Test reflection archive, filtering, and search

**Prerequisites:**
- Multiple reflections saved (at least 5)
- Reflections on different dates
- Various tags used

**Steps:**

1. **Navigate to Archive**
   - Go to `/dashboard/archive`
   - Expected: All reflections display in reverse chronological order
   - Check: Most recent reflection at top

2. **View Reflection Details**
   - Click on any reflection card
   - Expected: Full reflection text displays
   - Check: All details visible (date, mood, tags, full text)

3. **Filter by Date Range**
   - Use date picker to select date range (e.g., last 7 days)
   - Expected: Only reflections in range display
   - Check: Count updates correctly

4. **Filter by Tag**
   - Click on a tag (e.g., "gratitude")
   - Expected: Only reflections with that tag display
   - Check: Other reflections hidden

5. **Search Reflections**
   - Type keyword in search box (e.g., "happy")
   - Expected: Reflections containing keyword display
   - Check: Search is case-insensitive

6. **Export Reflections** (if implemented)
   - Click "Export" button
   - Select format (PDF/CSV)
   - Expected: File downloads with reflections
   - Check: All selected reflections included

**Expected Outcomes:**
✅ Archive displays all reflections  
✅ Filters work correctly  
✅ Search returns relevant results  

**Common Issues:**
- Archive not loading → Check database query, RLS policies
- Filters not working → Check filter logic in component
- Search slow → Consider adding database indexes

---

### Flow 5: Settings & Preferences

**Goal:** Test user settings and preference updates

**Prerequisites:**
- Signed in user
- On settings page

**Steps:**

1. **Navigate to Settings**
   - Go to `/dashboard/settings`
   - Expected: Settings page loads with current values
   - Check: Profile info pre-filled

2. **Update Profile Information**
   - Change full name
   - Update bio (if available)
   - Click "Save Changes"
   - Expected:
     - Success toast
     - Database updated
     - Name displays in navbar/dashboard
   - Check: Changes persist after refresh

3. **Update Email Preferences**
   - Toggle daily reminders on/off
   - Toggle weekly digest on/off
   - Change prompt time (e.g., 9am → 6pm)
   - Click "Save Preferences"
   - Expected:
     - Success message
     - Preferences saved to database
   - Check: Settings persist after refresh

4. **Test Notification Settings**
   - Enable/disable push notifications (if available)
   - Set quiet hours
   - Expected: Settings save correctly
   - Check: No errors

5. **View Subscription Status**
   - Scroll to subscription section
   - Expected: Shows current tier (Freemium/Premium)
   - Check:
     - Correct plan displays
     - If premium, shows subscription end date

**Expected Outcomes:**
✅ Profile updates saved  
✅ Preferences persist  
✅ UI reflects changes  

**Common Issues:**
- Settings not saving → Check API route, database update
- Changes not reflecting → Check page refresh, cache
- Validation errors → Check form validation logic

---

### Flow 6: Subscription Upgrade (Stripe)

**Goal:** Test complete premium subscription flow

**Prerequisites:**
- Freemium user
- Stripe in test mode
- Test card ready: `4242 4242 4242 4242`

**Steps:**

1. **Navigate to Settings**
   - Go to `/dashboard/settings`
   - Expected: Shows "Current Plan: Freemium"
   - Check: Upgrade button visible

2. **Click Upgrade to Premium**
   - Click "Upgrade to Premium" button
   - Expected: Modal/section opens with pricing
   - Check: Monthly (£12) and Annual (£120) options visible

3. **Select Billing Cycle**
   - Select "Monthly" or "Yearly"
   - Expected: Selection highlighted
   - Check: Correct price displays

4. **Click Upgrade Button**
   - Click final "Upgrade" or "Subscribe" button
   - Expected:
     - Loading state shows
     - Redirect to Stripe Checkout
   - Check:
     - Checkout session created
     - Correct amount displays in Stripe

5. **Complete Stripe Checkout**
   - Fill in email: your test email
   - Card number: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`
   - Click "Subscribe"
   - Expected:
     - Payment processes
     - Redirect back to settings page
   - Check: No payment errors

6. **Verify Subscription Activated**
   - Back on settings page
   - Expected:
     - "Current Plan: Premium" displays
     - Subscription confirmation email received
     - Database updated (`subscription_status = 'premium'`)
   - Check:
     - Subscription status correct
     - Email arrived
     - No errors in console

7. **Test Premium Features**
   - Navigate around app
   - Expected: Premium badge visible
   - Check: Access to premium-only features

8. **Test Manage Subscription**
   - Click "Manage Subscription" button
   - Expected: Redirect to Stripe Customer Portal
   - Check:
     - Can view invoice history
     - Can update payment method
     - Can cancel subscription

**Expected Outcomes:**
✅ Checkout completes successfully  
✅ Subscription activated  
✅ Confirmation email received  
✅ Database updated  
✅ Customer portal accessible  

**Common Issues:**
- Checkout fails → Check Stripe keys, price IDs
- Webhook not firing → Check webhook endpoint, secret
- Email not received → Check Resend configuration
- Status not updating → Check webhook handler, database

---

### Flow 7: Subscription Cancellation

**Goal:** Test subscription cancellation flow

**Prerequisites:**
- Active premium subscription
- Access to Stripe Customer Portal

**Steps:**

1. **Open Customer Portal**
   - From settings, click "Manage Subscription"
   - Expected: Redirect to Stripe portal
   - Check: Current subscription visible

2. **Cancel Subscription**
   - Click "Cancel subscription"
   - Confirm cancellation
   - Expected: Cancellation processed
   - Check: Confirmation message in portal

3. **Return to App**
   - Click return link or navigate back
   - Expected: Back on settings page
   - Check: Subscription status updated

4. **Verify Cancellation**
   - Check subscription status
   - Expected:
     - Status shows "Cancelled" or end date
     - Cancellation email received
     - Database updated (`subscription_status = 'cancelled'`)
   - Check: Access until end of billing period

**Expected Outcomes:**
✅ Cancellation processed  
✅ Email received  
✅ Database updated  
✅ Access maintained until end date  

**Common Issues:**
- Portal not loading → Check customer ID in database
- Cancellation not reflecting → Check webhook handler
- Email not sent → Check webhook integration

---

### Flow 8: Mobile Responsiveness

**Goal:** Test app on mobile devices

**Prerequisites:**
- Mobile device or browser DevTools in mobile mode

**Steps:**

1. **Test Landing Page**
   - View on mobile (375px width)
   - Expected: Layout adapts, no horizontal scroll
   - Check: All text readable, buttons accessible

2. **Test Navigation**
   - Open mobile menu
   - Navigate between pages
   - Expected: Menu opens/closes smoothly
   - Check: All links work

3. **Test Dashboard**
   - View dashboard on mobile
   - Expected: Cards stack vertically, content readable
   - Check: No overflow, proper spacing

4. **Test Reflection Writing**
   - Write reflection on mobile
   - Expected: Textarea expands properly, keyboard doesn't cover content
   - Check: Can save successfully

5. **Test Settings**
   - Update settings on mobile
   - Expected: Forms are usable, buttons accessible
   - Check: Toggles work, dropdowns open properly

**Expected Outcomes:**
✅ Responsive on all screen sizes  
✅ No layout breaking  
✅ All features accessible  

**Common Issues:**
- Horizontal scroll → Check CSS, container widths
- Text too small → Adjust font sizes
- Buttons too small → Increase touch targets
- Keyboard covers input → Adjust viewport settings

---

### Flow 9: Error Handling

**Goal:** Test error states and recovery

**Test Cases:**

1. **Network Error**
   - Disable internet
   - Try to save reflection
   - Expected: Clear error message
   - Check: User can retry when connection restored

2. **Invalid Input**
   - Submit form with empty required fields
   - Expected: Validation errors display
   - Check: Error messages are helpful

3. **Session Expiry**
   - Wait for session to expire (or manually clear auth)
   - Try to access protected page
   - Expected: Redirect to login
   - Check: Can sign in and continue

4. **API Failure**
   - Simulate API failure (return 500)
   - Expected: User-friendly error message
   - Check: App doesn't crash, user can retry

**Expected Outcomes:**
✅ Errors handled gracefully  
✅ Clear error messages  
✅ User can recover  

---

## 🐛 Bug Tracking

### Critical Issues (Block Release)
- [ ] Authentication doesn't work
- [ ] Cannot save reflections
- [ ] Payment processing fails
- [ ] Data loss occurs

### High Priority (Should Fix)
- [ ] UI breaks on mobile
- [ ] Slow page loads (>3s)
- [ ] Email notifications fail
- [ ] Search returns wrong results

### Medium Priority (Should Address)
- [ ] Minor styling issues
- [ ] Non-critical features broken
- [ ] Performance could be better

### Low Priority (Nice to Fix)
- [ ] Cosmetic issues
- [ ] Enhancement requests
- [ ] Documentation typos

---

## ✅ Final Testing Checklist

Before deployment:

### Functionality
- [ ] All user flows tested and working
- [ ] No critical bugs
- [ ] Error handling works
- [ ] Forms validate properly
- [ ] API routes respond correctly

### Performance
- [ ] Page load time < 3 seconds
- [ ] Images optimized
- [ ] No memory leaks
- [ ] Database queries efficient

### Security
- [ ] No hardcoded secrets
- [ ] Authentication works correctly
- [ ] RLS policies enforced
- [ ] HTTPS enabled (production)

### User Experience
- [ ] Responsive on all devices
- [ ] Accessible (WCAG compliance)
- [ ] Clear error messages
- [ ] Loading states implemented
- [ ] Smooth animations

### Integrations
- [ ] Supabase connection stable
- [ ] Stripe payments working
- [ ] Email delivery working
- [ ] AI prompts generating

---

## 📊 Test Results Template

Use this template to document test results:

```
Test Date: YYYY-MM-DD
Tester: [Name]
Environment: [Local/Staging/Production]

Flow Tested: [Flow Name]
Status: [✅ Pass | ⚠️ Issues Found | ❌ Fail]

Issues Found:
1. [Description]
   - Severity: [Critical/High/Medium/Low]
   - Steps to Reproduce: [Steps]
   - Expected: [Expected behavior]
   - Actual: [Actual behavior]
   - Screenshot: [Link if available]

Notes:
[Any additional observations]
```

---

## 🚀 Ready for Production?

Answer these questions before deploying:

1. **Have all critical flows been tested?** ✅ / ❌
2. **Are there any blocking bugs?** Yes / No
3. **Has the app been tested on multiple devices?** ✅ / ❌
4. **Are all integrations working?** ✅ / ❌
5. **Is error handling comprehensive?** ✅ / ❌
6. **Have stakeholders reviewed?** ✅ / ❌

If all answers are positive, you're ready! 🎉

---

*Last Updated: 2025-01-07*  
*Testing Guide - Prompt & Pause*
