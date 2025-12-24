# Freshdesk Integration Setup Guide

**Last Updated: October 2025 | Freshdesk Free Tier (Sprout Plan)**

This guide will help you set up Freshdesk's free tier integration with Prompt & Pause for complete support ticket management.

## 📋 Prerequisites

- Freshdesk free account (**Sprout Plan** - up to 10 agents, unlimited tickets)
- Access to your Prompt & Pause codebase
- Domain access for email forwarding (optional, for email-to-ticket)
- **Note:** As of Oct 2025, Freshdesk free tier includes email support, basic automations, and webhooks

---

## 🧭 Quick Navigation Guide (October 2025 UI)

Freshdesk's Omnichannel interface is organized around these key areas:

### Admin Settings Structure (Based on Free Tier):

When you click the **Admin/Settings icon** (⚙️ gear in bottom-left), you'll see these categories:

**📋 Workflows**
- **Ticket Fields** - Customize ticket type, categorization, prioritization
- **Ticket Forms** - Show different forms to customers
- **SLA Policies** - Set response time targets
- **Automations** - Create rules for ticket handling (THIS IS WHERE WEBHOOKS GO!)
- **Email Notifications** - Configure email alerts
- **Customer Satisfaction** - Surveys and feedback
- **Proactive Outreach** - Reach out to customers
- **Omniroute™** - Routing preferences

**👥 Agent Productivity**
- Canned Responses, Templates, Scenario Automations
- Arcade, Tags, Threads
- Session Replay, Average Handling Time

**🏢 Support Operations**
- Apps, Contact Fields, Company Fields
- Multiple Products, Advanced Ticketing
- Custom Objects, Freshservice, Freshsales Suite
- Sandbox

**📱 Channels**
- **Email** ← EMAIL-TO-TICKET IS HERE
- Portals, Widgets, Phone, Chat
- Facebook, Feedback Form, WhatsApp

**👤 Team**
- Agents, Groups, Roles
- Business Hours, Skills, Agent Shifts
- Agent Statuses

### Critical Paths for This Integration:

1. **API Key (MOST IMPORTANT!)**: 
   - Click your **avatar/name** (top-right) → **Profile settings**
   - Scroll down to **"Your API Key"** section
   - OR direct URL: `https://YOURDOMAIN.freshdesk.com/a/profile/settings`

2. **Email Configuration**: 
   - Admin → **Channels** → **Email**
   - Look for your support email address (e.g., `yourcompany@tickets.freshdesk.com`)

3. **Automations (FOR WEBHOOKS)**: 
   - Admin → **Workflows** → **Automations**
   - You'll see tabs: Ticket Creation, Ticket Updates, Time Triggers
   - Click **"New Rule"** in Ticket Updates tab

4. **Ticket Fields** (NOT statuses - those are built-in): 
   - Admin → **Workflows** → **Ticket Fields**
   - Default statuses/priorities cannot be changed on free tier
   - You can add custom fields here if available

**⚠️ IMPORTANT NOTE ABOUT FREE TIER:**
- Ticket Statuses and Priorities are **FIXED** (cannot be customized on free tier)
- Default statuses: Open (2), Pending (3), Resolved (4), Closed (5)
- Default priorities: Low (1), Medium (2), High (3), Urgent (4)
- These work perfectly with our integration!

---

## 🚀 Part 1: Freshdesk Account Setup

### 1.1 Create Freshdesk Account

1. Go to [freshdesk.com/signup](https://freshdesk.com/signup)
2. Enter your details:
   - Work email
   - Phone number (optional)
   - Company name: "Prompt and Pause"
3. Choose your **subdomain** carefully (e.g., `promptandpause.freshdesk.com`)
   - ⚠️ **This cannot be changed later!**
4. Select the **FREE plan (Sprout)** - "Get Started Free"
5. Complete email verification
6. Skip the onboarding wizard or answer basic questions
7. You'll land in your Freshdesk dashboard

### 1.2 Ticket Settings (No Configuration Needed!)

**IMPORTANT:** On Freshdesk free tier, statuses and priorities are **fixed and cannot be changed**.

**Default Statuses (Built-in):**
- ✅ Open (status ID: 2)
- ✅ Pending (status ID: 3)
- ✅ Resolved (status ID: 4)
- ✅ Closed (status ID: 5)

**Default Priorities (Built-in):**
- ✅ Low (priority ID: 1)
- ✅ Medium (priority ID: 2)
- ✅ High (priority ID: 3)
- ✅ Urgent (priority ID: 4)

**These work perfectly with our integration - no changes needed!**

**Note:** You won't find "Ticket Statuses" or "Ticket Priorities" in the Workflows menu on free tier because they're fixed. This is actually good - less configuration!

### 1.3 Custom Fields (SKIP THIS - Use Tags Instead)

**⚠️ IMPORTANT:** Custom fields are **NOT available** on Freshdesk free tier.

**Instead, we'll use TAGS** to track:
- User tier: `freemium` or `premium` tag
- Source: `dashboard`, `homepage`, `email` tags
- Category: `general`, `bug`, `billing`, `feature`, `account` tags

**Tags are automatically created when we sync tickets via API - no setup needed!**

**Why this works:**
- ✅ Tags are fully supported on free tier
- ✅ Can filter and search by tags
- ✅ Multiple tags per ticket
- ✅ Our `freshdeskService.ts` already uses tags

**Skip this section entirely - we're good to go!**

### 1.4 Generate API Key ⚠️ CRITICAL STEP

**October 2025 Method:**

1. Click your **avatar/profile picture** in the **top-right corner**
2. Select **"Profile settings"** from dropdown
3. You'll see your profile page with tabs/sections on the left:
   - Personal Info
   - Change Password
   - **Your API Key** ← Look for this!
4. Scroll down to the **"Your API Key"** section
5. If you see a masked key (dots): Click **"View API Key"**
6. If no key exists: Click **"Generate New API Key"**
7. **COPY THE ENTIRE KEY** - save it immediately!

**Direct URL Method:**
```
https://YOURSUBDOMAIN.freshdesk.com/a/profile/settings
```
Replace `YOURSUBDOMAIN` with your actual subdomain, then scroll to "Your API Key"

**Troubleshooting:**
- If you don't see "Your API Key" section:
  - You might need to be an **Admin** or **Account Admin**
  - Free tier accounts have API access by default
  - Try logging out and back in
- If API key is disabled:
  - Contact Freshdesk support (free tier includes API access)

**⚠️ Security Note:** 
- Treat this like a password - never commit to git!
- Regenerate if compromised
- Each agent can have their own API key

---

## 🔧 Part 2: Configure Your Application

### 2.1 Update Environment Variables

Edit your `.env.local` file:

```env
# Freshdesk Configuration
FRESHDESK_DOMAIN=yoursubdomain.freshdesk.com
FRESHDESK_API_KEY=your_api_key_here
NEXT_PUBLIC_FRESHDESK_ENABLED=false  # Keep false until fully configured
```

**Important:** Replace:
- `yoursubdomain` with your actual Freshdesk subdomain
- `your_api_key_here` with the API key from step 1.4

### 2.2 Run Database Migrations (If Needed)

If you haven't already run the HubSpot migrations (which are compatible):

```bash
supabase db push
```

The existing schema works for Freshdesk (we reuse the `hubspot_ticket_id` column temporarily).

---

## 📧 Part 3: Email-to-Ticket Setup (Optional)

### 3.1 Find Your Freshdesk Support Email

**October 2025 Method:**

1. Click **Admin** (gear icon ⚙️) in the bottom-left corner
2. Navigate to: **Channels** section → **Email**
3. Look for **"Support Email"** or **"Default Support Email"**
   - Format: `YOURSUBDOMAIN@tickets.freshdesk.com`
   - Example: `promptandpause@tickets.freshdesk.com`
4. **Copy this email address** - you'll need it for forwarding

**What this email does:**
- Any email sent to this address automatically creates a ticket
- Sender becomes the contact (auto-created if new)
- Subject becomes ticket subject
- Body becomes ticket description

**Pro Tip:** Test it immediately by sending yourself an email!

### 3.2 Configure Email Forwarding

You have two options:

#### Option A: Direct Forwarding (Recommended)
Set up email forwarding from your domain:
- Forward `support@promptandpause.com` → `yourcompany@tickets.freshdesk.com`
- Forward `contact@promptandpause.com` → `yourcompany@tickets.freshdesk.com`

#### Option B: Custom Mailbox (Requires DNS)
1. Click the **gear icon** (⚙️) in bottom-left
2. Go to **Channels → Email → Email Server Settings**
3. Click **+ Add Email Address**
4. Enter your custom email (e.g., `support@promptandpause.com`)
5. Follow Freshdesk's instructions to verify via DNS records

### 3.3 Test Email-to-Ticket

Send a test email to your support address and verify:
1. Ticket appears in Freshdesk
2. Contact is created/updated automatically
3. Subject and body are captured correctly

---

## 🔗 Part 4: Webhook Configuration

Webhooks enable bidirectional sync (Freshdesk ↔ Your App).

### 4.1 Set Up Automations for Webhooks

**October 2025 Method (FREE TIER):**

**Important:** Webhooks are configured via **Automation Rules** in the **Workflows** section.

1. Click **Admin** (⚙️ gear icon) in bottom-left corner
2. Navigate to: **Workflows** section
3. Click on **Automations**
4. You'll see three tabs:
   - Ticket Creation
   - **Ticket Updates** ← We'll use this one!
   - Time Triggers
5. Click **"New Rule"** button (top-right)

**What you'll see:**
- A form with sections: Name, Description, When (trigger), Conditions, Actions
- Under "Actions" you can add **"Trigger Webhook"**

**✅ Confirmed:** Free tier DOES support webhook automations!

#### Rule 1: Ticket Created Webhook

**Create New Automation:**

1. **Name your rule**: "Webhook - Ticket Created"
2. **Description**: "Notify our app when a ticket is created"

**When (Trigger):**
- Event: **"Ticket is Created"**
- Applies to: **All tickets** (no conditions needed)

**Perform these actions:**
- Click **"+ Add Action"**
- Select **"Trigger webhook"**
- Configure webhook:
  - **Request Type**: `POST`
  - **URL**: `https://your-production-domain.com/api/webhooks/freshdesk`
    - For testing: Use ngrok URL (see section 4.2)
  - **Encoding**: `JSON`
  - **Content**: Click "Advanced" and paste:
    ```json
    {
      "event": "ticket_created",
      "ticket_id": {{ticket.id}},
      "subject": "{{ticket.subject}}",
      "status": "{{ticket.status}}",
      "priority": "{{ticket.priority}}",
      "requester_email": "{{ticket.requester.email}}",
      "requester_name": "{{ticket.requester.name}}"
    }
    ```
  - **Note:** Remove quotes around `{{ticket.id}}` as it's a number

3. Click **"Save"** or **"Preview and Save"**
4. **Enable** the automation (toggle switch)

#### Rule 2: Ticket Updated Webhook

**Create New Automation:**

1. **Name**: "Webhook - Ticket Updated"
2. **Description**: "Notify when status or priority changes"

**When (Trigger):**
- Event: **"Ticket is Updated"**
- Involves any of these events: Check **"Status"** and **"Priority"**

**Conditions (Optional but recommended):**
- To avoid too many webhooks, add condition:
  - "Ticket Status" "is" "Any of" [Open, Pending, Resolved, Closed]

**Perform these actions:**
- Click **"+ Add Action"**
- Select **"Trigger webhook"**
- Configure:
  - **Request Type**: `POST`
  - **URL**: `https://your-domain.com/api/webhooks/freshdesk`
  - **Encoding**: `JSON`
  - **Content**:
    ```json
    {
      "event": "ticket_updated",
      "ticket_id": {{ticket.id}},
      "subject": "{{ticket.subject}}",
      "status": "{{ticket.status}}",
      "priority": "{{ticket.priority}}",
      "updated_at": "{{ticket.updated_at}}"
    }
    ```

3. **Save** and **Enable**

#### Rule 3: Note/Reply Added Webhook (Optional)

**Note:** This is optional - you may not need real-time note sync.

**Create New Automation:**

1. **Name**: "Webhook - Reply Added"
2. **Description**: "Notify when agent replies to ticket"

**When (Trigger):**
- Event: **"Reply is Sent"**
- Type: Choose **"Public Reply"** (not private notes)

**Perform these actions:**
- Click **"+ Add Action"**
- Select **"Trigger webhook"**
- Configure:
  - **Request Type**: `POST`
  - **URL**: `https://your-domain.com/api/webhooks/freshdesk`
  - **Encoding**: `JSON`
  - **Content**:
    ```json
    {
      "event": "reply_added",
      "ticket_id": {{ticket.id}},
      "reply_content": "{{ticket.latest_public_comment}}",
      "agent_email": "{{ticket.agent.email}}"
    }
    ```

3. **Save** and **Enable**

**Skip this if:** You don't need real-time agent reply notifications

### 4.2 Webhook URL

Your webhook endpoint will be:
```
https://your-production-domain.com/api/webhooks/freshdesk
```

**For local testing**, use [ngrok](https://ngrok.com):
```bash
ngrok http 3000
# Use the HTTPS URL: https://abc123.ngrok.io/api/webhooks/freshdesk
```

---

## ✅ Part 5: Testing

### 5.1 Test API Connection

1. Create a test endpoint or use the provided test route:
   ```
   GET /api/admin/freshdesk/test
   ```

2. Expected response:
   ```json
   {
     "success": true,
     "message": "Freshdesk connection successful",
     "details": {
       "domain": "promptandpause.freshdesk.com",
       "ticketCount": 0
     }
   }
   ```

### 5.2 Test Dashboard Form Integration

1. Enable Freshdesk: Set `NEXT_PUBLIC_FRESHDESK_ENABLED=true` in `.env.local`
2. Restart your dev server
3. Go to your dashboard support form
4. Submit a test ticket
5. Verify:
   - ✅ Ticket appears in your local database
   - ✅ Ticket syncs to Freshdesk
   - ✅ Contact is created in Freshdesk

### 5.3 Test Homepage Form Integration

1. Go to homepage contact form
2. Fill out and submit
3. Verify same checks as above

### 5.4 Test Email-to-Ticket

1. Send email to `support@promptandpause.com`
2. Check Freshdesk - ticket should appear
3. Check your webhook logs - should receive `ticket_created` event
4. Check local database - ticket should sync

### 5.5 Test Bidirectional Sync

1. Update a ticket in Freshdesk (change status/priority)
2. Webhook should trigger
3. Check local database - changes should reflect

---

## 🗺️ Field Mapping Reference

### Status Mapping

| Local Status | Freshdesk Status ID | Freshdesk Label |
|--------------|---------------------|-----------------|
| `open` | 2 | Open |
| `in_progress` | 3 | Pending |
| `resolved` | 4 | Resolved |
| `closed` | 5 | Closed |

### Priority Mapping

| Local Priority | Freshdesk Priority ID | Freshdesk Label |
|----------------|----------------------|-----------------|
| `low` | 1 | Low |
| `medium` | 2 | Medium |
| `high` | 3 | High |
| `urgent` | 4 | Urgent |

### Category → Tags

| Local Category | Freshdesk Tag |
|----------------|---------------|
| `general` | general |
| `bug` | bug |
| `billing` | billing |
| `feature` | feature-request |
| `account` | account |
| `other` | other |

---

## 🐛 Troubleshooting

### API Connection Fails

**Error:** "Freshdesk connection failed"

**Solutions:**
1. Verify `FRESHDESK_DOMAIN` format (should be `yoursubdomain.freshdesk.com`, not `https://...`)
2. Check API key is correct (regenerate if needed)
3. Ensure `NEXT_PUBLIC_FRESHDESK_ENABLED=true`

### Ticket Creation Fails

**Error:** "Failed to create Freshdesk ticket"

**Solutions:**
1. Check API rate limit (100 requests per minute on free tier)
2. Verify email address is valid
3. Check Freshdesk logs: Admin > Audit Log

### Webhook Not Triggering

**Solutions:**
1. Verify automation rules are active
2. Check webhook URL is publicly accessible
3. Test webhook URL with curl:
   ```bash
   curl -X POST https://your-domain.com/api/webhooks/freshdesk \
     -H "Content-Type: application/json" \
     -d '{"event":"test","ticket_id":"123"}'
   ```
4. Check Freshdesk Automation execution logs

### Custom Fields Not Working

**Solution:**
1. Custom fields may not be available on free tier
2. Remove `custom_fields` from `mapLocalToFreshdesk` if encountering errors
3. Use tags instead to track metadata

---

## 📊 Freshdesk Free Tier Limits

- **Agents:** Up to 10
- **Tickets:** Unlimited
- **API Rate Limit:** 100 requests/minute
- **Email Support:** Yes
- **Automations:** Basic (sufficient for webhooks)
- **Custom Fields:** Limited
- **Knowledge Base:** Yes
- **Reports:** Basic

---

## 🎯 Next Steps

1. ✅ Complete Parts 1-3 of this guide
2. ✅ Test API connection
3. ✅ Test ticket creation from dashboard/homepage
4. ✅ Configure webhooks (Part 4)
5. ✅ Test bidirectional sync
6. 🔄 Build admin panel enhancements
7. 🚀 Deploy to production

---

## 🆘 Support

- **Freshdesk Documentation:** [developers.freshdesk.com](https://developers.freshdesk.com)
- **API Reference:** [developers.freshdesk.com/api](https://developers.freshdesk.com/api)
- **Community:** [community.freshdesk.com](https://community.freshdesk.com)

---

## 📝 Production Checklist

Before going live:

- [ ] Freshdesk account fully configured
- [ ] Custom fields created (if using)
- [ ] Email forwarding working
- [ ] Automation rules/webhooks active
- [ ] API credentials in production `.env`
- [ ] `NEXT_PUBLIC_FRESHDESK_ENABLED=true`
- [ ] Test ticket creation from all entry points
- [ ] Test bidirectional sync
- [ ] Monitor logs for 24 hours post-launch
- [ ] Train support team on Freshdesk interface

---

*Last updated: 2025-10-14*
