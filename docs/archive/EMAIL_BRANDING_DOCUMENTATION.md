# Email Branding & Templates Documentation

## 🎨 Brand Identity

### Brand Colors
All emails use consistent colors matching the website theme:

```typescript
PRIMARY:      #667eea  // Main brand purple
PRIMARY_DARK: #5568d3  // Hover/dark shade
TEXT:         #333333  // Main text
TEXT_LIGHT:   #666666  // Secondary text
BACKGROUND:   #f7fafc  // Light background
WHITE:        #ffffff  // Pure white
BORDER:       #e2e8f0  // Border colors
```

### Logo
- **Location**: `/public/prompt&pause.svg`
- **Usage**: All emails include the logo in the header
- **URL**: `${APP_URL}/prompt&pause.svg`
- **Display**: Height 40px, auto width, centered

---

## 📧 Email Template System

### File Structure
```
lib/services/
├── emailService.ts        // Main email sending functions
├── emailTemplates.ts      // Reusable branded components
└── README_EMAILS.md       // This documentation
```

### Reusable Components (`emailTemplates.ts`)

#### 1. Email Wrapper
Wraps all email content with consistent structure:
```typescript
emailWrapper(content: string): string
```

#### 2. Email Header
Logo and branding:
```typescript
emailHeader(): string
```

#### 3. Email Footer
Copyright, links, tagline:
```typescript
emailFooter(): string
```

#### 4. CTA Button
Primary call-to-action buttons:
```typescript
ctaButton(text: string, url: string): string
```

#### 5. Headings
```typescript
h1(text: string): string  // Main heading (28px, purple)
h2(text: string): string  // Sub heading (22px, dark)
h3(text: string): string  // Section heading (18px, purple)
```

#### 6. Content Elements
```typescript
paragraph(text: string): string  // Body text
list(items: string[]): string    // Bullet lists
infoBox(content: string): string // Highlighted info
alertBox(content: string, type): string // Warnings/notices
```

---

## 📨 Email Types

### 1. Welcome Email
**Trigger**: User signs up  
**File**: `emailService.ts` → `sendWelcomeEmail()`  
**Contains**:
- Welcome message
- Getting started steps
- Dashboard link

### 2. Daily Prompt Email
**Trigger**: Cron job (daily)  
**File**: `emailService.ts` → `sendDailyPromptEmail()`  
**Contains**:
- Personalized prompt
- Reflection encouragement
- Direct link to dashboard

### 3. Weekly Digest Email
**Trigger**: Cron job (weekly)  
**File**: `emailService.ts` → `sendWeeklyDigestEmail()`  
**Contains**:
- Week summary
- Total reflections
- Mood distribution
- Streak info
- Top tags

### 4. Subscription Confirmation
**Trigger**: Stripe payment success  
**File**: `emailService.ts` → `sendSubscriptionEmail()`  
**Type**: 'confirmation'  
**Contains**:
- Thank you message
- Premium features list
- Dashboard link

### 5. Subscription Cancellation
**Trigger**: User cancels subscription  
**File**: `emailService.ts` → `sendSubscriptionEmail()`  
**Type**: 'cancellation'  
**Contains**:
- Cancellation confirmation
- Access end date
- Re-subscribe option

### 6. Data Export Email
**Trigger**: User clicks "Export Data"  
**File**: `emailService.ts` → `sendDataExportEmail()`  
**Contains**:
- PDF attachment with all user data
- Security warning
- What's included list

---

## 🔧 How to Create a New Email Template

### Step 1: Import Components
```typescript
import {
  emailWrapper,
  h1, h2, h3,
  paragraph,
  ctaButton,
  infoBox,
  list
} from './emailTemplates'
```

### Step 2: Build Content
```typescript
function generateMyEmailHTML(name: string): string {
  const content = `
    ${h1('Welcome, ' + name + '!')}
    ${paragraph('This is your email content...')}
    ${infoBox(list([
      'Feature 1',
      'Feature 2',
      'Feature 3'
    ]))}
    ${ctaButton('Take Action', 'https://yourlink.com')}
  `
  
  return emailWrapper(content)
}
```

### Step 3: Send Email
```typescript
export async function sendMyEmail(
  email: string,
  userId: string,
  userName: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Email service not configured' }
    }

    const { data, error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: email,
      subject: 'Your Email Subject',
      html: generateMyEmailHTML(userName),
    })

    if (error) {
      await logEmailDelivery(userId, 'my_email_type', email, 'failed', null, error.message)
      return { success: false, error: error.message }
    }

    await logEmailDelivery(userId, 'my_email_type', email, 'sent', data?.id || null)
    return { success: true, emailId: data?.id }
  } catch (error) {
    return { success: false, error: 'Unexpected error' }
  }
}
```

---

## 📊 Email Delivery Logging

All emails are logged to `email_delivery_log` table:

**Fields**:
- `user_id`: User UUID
- `email_type`: Type of email
- `resend_email_id`: Resend's tracking ID
- `recipient_email`: Email address
- `status`: sent | delivered | failed
- `sent_at`: Timestamp

**Email Types**:
- `daily_prompt`
- `weekly_digest`
- `welcome`
- `subscription_confirm`
- `subscription_cancelled`
- `data_export`

---

## 🎯 Best Practices

### DO:
✅ Use `emailWrapper()` for all emails  
✅ Include logo in header via `emailHeader()`  
✅ Use brand colors consistently  
✅ Test on multiple email clients  
✅ Include unsubscribe options where required  
✅ Log all email deliveries  
✅ Handle errors gracefully  

### DON'T:
❌ Hardcode colors (use BRAND_COLORS)  
❌ Skip error handling  
❌ Forget to log deliveries  
❌ Use inline styles without variables  
❌ Skip mobile testing  
❌ Send without proper authentication  

---

## 🧪 Testing Emails

### Local Testing
```bash
# Set environment variables
RESEND_API_KEY=your_test_key
RESEND_FROM_EMAIL=test@promptandpause.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Send test email via API route or function
```

### Email Clients to Test
- Gmail (Web & Mobile)
- Outlook (Web & Desktop)
- Apple Mail (iOS & macOS)
- Yahoo Mail
- Mobile devices (iOS/Android)

---

## 🔐 Environment Variables

Required for email functionality:

```env
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=prompts@promptandpause.com
NEXT_PUBLIC_APP_URL=https://yoursite.com
```

---

## 📱 Mobile Optimization

All templates are responsive:
- Max width: 600px
- Tables for layout compatibility
- Inline CSS (email client requirement)
- Touch-friendly buttons (min 44px height)
- Readable font sizes (16px body, 28px headings)

---

## 🎨 PDF Branding

PDF exports also use consistent branding:

**Location**: `lib/services/pdfService.ts`

**Brand Elements**:
- Primary color: #667eea (rgb(0.4, 0.495, 0.918))
- Text color: #333333 (rgb(0.2, 0.2, 0.2))
- Gray color: #666666 (rgb(0.4, 0.4, 0.4))
- Helvetica font family
- Branded footer

---

## 🚀 Deployment Checklist

Before going live:
- [ ] Update NEXT_PUBLIC_APP_URL to production domain
- [ ] Verify logo loads at `${APP_URL}/prompt&pause.svg`
- [ ] Test all email templates
- [ ] Verify Resend API key is production key
- [ ] Check email delivery logs are working
- [ ] Test unsubscribe links
- [ ] Verify all links point to production
- [ ] Test on multiple email clients
- [ ] Check mobile rendering
- [ ] Verify GDPR compliance

---

## 📞 Support

For email issues:
- Check Resend dashboard for delivery status
- Review `email_delivery_log` table in Supabase
- Verify environment variables are set
- Check console logs for error messages

**Resend Dashboard**: https://resend.com/emails

---

*Last Updated: 2025-10-09*
*Maintained by: Development Team*
