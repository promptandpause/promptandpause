# 🚀 HubSpot Free Tier Setup Guide for Prompt & Pause

**Last Updated:** January 14, 2025  
**Version:** 1.0  
**Estimated Setup Time:** 30-45 minutes

---

## 📋 Table of Contents

1. [Create HubSpot Account](#1-create-hubspot-account)
2. [Configure Basic Settings](#2-configure-basic-settings)
3. [Set Up Ticket Pipeline](#3-set-up-ticket-pipeline)
4. [Create Custom Ticket Properties](#4-create-custom-ticket-properties)
5. [Create Private App for API Access](#5-create-private-app-for-api-access)
6. [Configure Email Integration](#6-configure-email-integration)
7. [Set Up Automation (Tag-Based Routing)](#7-set-up-automation-tag-based-routing)
8. [Configure Webhooks](#8-configure-webhooks)
9. [Get Your Credentials](#9-get-your-credentials)
10. [Verify Setup](#10-verify-setup)

---

## 1. Create HubSpot Account

### Step 1.1: Sign Up
1. Go to: **https://www.hubspot.com/products/get-started**
2. Click **"Get started free"**
3. Fill in:
   - Your email: `promptpause@gmail.com` (your admin email)
   - Company name: `Prompt & Pause`
   - Website: `promptandpause.com`
4. Skip any upsell prompts
5. Select **"Free"** plan (not trial!)

### Step 1.2: Complete Onboarding
1. Skip optional setup wizards
2. Go directly to dashboard: **https://app.hubspot.com/**

---

## 2. Configure Basic Settings

### Step 2.1: Company Information
1. Click **Settings** (gear icon, top-right)
2. Navigate to: **General** → **Account Defaults**
3. Set:
   - Company Name: `Prompt & Pause`
   - Domain: `promptandpause.com`
   - Time Zone: Your timezone
   - Currency: Your currency

### Step 2.2: User Settings
1. Go to: **Settings** → **Users & Teams**
2. Add your admin email if not already there
3. **Note:** Free tier = 2 users max

---

## 3. Set Up Ticket Pipeline

### Step 3.1: Create Support Pipeline
1. Go to: **Service** → **Tickets** (left sidebar)
2. Click **Settings** → **Pipelines**
3. Click **"Create pipeline"**
4. Name it: **"Prompt & Pause Support"**

### Step 3.2: Configure Pipeline Stages
Create these stages (in order):

| Stage Name | Internal Name | Purpose |
|------------|---------------|---------|
| **New** | `new` | Initial ticket creation |
| **Open** | `open` | Acknowledged, awaiting work |
| **In Progress** | `in_progress` | Actively being worked on |
| **Waiting on Customer** | `waiting_on_customer` | Awaiting customer response |
| **Resolved** | `resolved` | Issue fixed, awaiting confirmation |
| **Closed** | `closed` | Ticket completed |

**How to add stages:**
1. In pipeline editor, click **"+ Add stage"**
2. Enter stage name
3. Click **"Save"**
4. Repeat for all stages

### Step 3.3: Note the Pipeline ID
1. After saving, click on the pipeline name
2. Look at the URL: `https://app.hubspot.com/contacts/[PORTAL_ID]/objects/0-5/views/[PIPELINE_ID]`
3. **Copy the PIPELINE_ID** - you'll need this later!

---

## 4. Create Custom Ticket Properties

Custom properties let us store additional data on tickets.

### Step 4.1: Navigate to Properties
1. Go to: **Settings** → **Properties**
2. Select **"Ticket properties"** from dropdown

### Step 4.2: Create Properties

#### Property 1: `pnp_category`
1. Click **"Create property"**
2. Select object: **Tickets**
3. Group: **Ticket information**
4. Label: **Category**
5. Field type: **Dropdown select**
6. Internal name: `pnp_category`
7. Options (add these):
   - `general` - General Inquiry
   - `bug` - Bug Report
   - `billing` - Billing & Subscription
   - `feature` - Feature Request
   - `account` - Account & Privacy
   - `other` - Other
8. Click **"Create"**

#### Property 2: `pnp_priority`
1. Click **"Create property"**
2. Label: **Priority**
3. Field type: **Dropdown select**
4. Internal name: `pnp_priority`
5. Options:
   - `low` - Low
   - `medium` - Medium
   - `high` - High
6. Click **"Create"**

#### Property 3: `pnp_user_tier`
1. Click **"Create property"**
2. Label: **User Tier**
3. Field type: **Dropdown select**
4. Internal name: `pnp_user_tier`
5. Options:
   - `freemium` - Free User
   - `premium` - Premium User
6. Click **"Create"**

#### Property 4: `pnp_source`
1. Click **"Create property"**
2. Label: **Source**
3. Field type: **Dropdown select**
4. Internal name: `pnp_source`
5. Options:
   - `dashboard` - Dashboard Form
   - `homepage_form` - Homepage Contact Form
   - `email` - Email
   - `webhook` - API/Webhook
6. Click **"Create"**

#### Property 5: `pnp_local_ticket_id`
1. Click **"Create property"**
2. Label: **Local Ticket ID**
3. Field type: **Single-line text**
4. Internal name: `pnp_local_ticket_id`
5. Description: "Internal database ticket ID"
6. Click **"Create"**

---

## 5. Create Private App for API Access

This gives your application access to HubSpot's API.

### Step 5.1: Create Private App
1. Go to: **Settings** → **Integrations** → **Private Apps**
2. Click **"Create private app"**
3. Fill in:
   - **Name:** `Prompt & Pause Integration`
   - **Description:** `Bidirectional sync between Prompt & Pause support system and HubSpot`

### Step 5.2: Configure Scopes
Click **"Scopes"** tab and enable these:

**CRM Scopes:**
- ✅ `crm.objects.contacts.read`
- ✅ `crm.objects.contacts.write`
- ✅ `tickets` (both read and write)

**Notes Scopes:**
- ✅ `crm.objects.notes.read`
- ✅ `crm.objects.notes.write`

**Optional (for future):**
- ✅ `crm.objects.owners.read` (if you want to assign to specific users)

### Step 5.3: Create App
1. Click **"Create app"**
2. **IMPORTANT:** Copy the **Access Token** immediately!
3. Store it safely - you can't view it again!

**Access Token Format:**
```
pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 6. Configure Email Integration

HubSpot Free allows you to receive emails and convert them to tickets.

### Step 6.1: Get HubSpot Email Address
1. Go to: **Service** → **Tickets**
2. Click **Settings** → **Email**
3. You'll see your HubSpot email address:
   ```
   support-[your-account-id]@tickets.hubspotmail.com
   ```
4. **Copy this email address**

### Step 6.2: Set Up Email Forwarding

You have two options:

#### Option A: Direct Forwarding (Recommended for Free)
1. In your email provider (Gmail, Outlook, etc.)
2. Set up email forwarding:
   - Forward `support@promptandpause.com` → `support-[your-account-id]@tickets.hubspotmail.com`
   - Forward `contact@promptandpause.com` → `support-[your-account-id]@tickets.hubspotmail.com`

**Gmail Example:**
1. Go to Gmail settings
2. Forwarding and POP/IMAP
3. Add forwarding address
4. Confirm verification email from HubSpot

#### Option B: Email Alias (If Available)
1. In your domain's DNS settings
2. Create email aliases:
   - `support@` → your HubSpot ticket email
   - `contact@` → your HubSpot ticket email

### Step 6.3: Configure Email Parsing
1. In HubSpot: **Settings** → **Objects** → **Tickets** → **Email to Ticket**
2. Enable: **"Create tickets from forwarded emails"**
3. Set default properties:
   - Pipeline: `Prompt & Pause Support`
   - Stage: `New`
   - Priority: `Medium`
   - Category: `General` (default)

---

## 7. Set Up Automation (Tag-Based Routing)

Since free tier doesn't have teams, we'll use **tags** and **automation** for routing.

### Step 7.1: Create Workflows

1. Go to: **Automation** → **Workflows**
2. Click **"Create workflow"**
3. Select: **"From scratch"**
4. Choose: **"Ticket-based"**

#### Workflow 1: Auto-Tag by Category

**Name:** "Auto-Tag Support Tickets"

**Trigger:**
- When: Ticket is created
- Filters: All tickets

**Actions:**
1. **If/then branch:** Category = "bug"
   - **Action:** Add tag `#bug` and `#technical-support`
   
2. **If/then branch:** Category = "billing"
   - **Action:** Add tag `#billing`
   
3. **If/then branch:** Category = "feature"
   - **Action:** Add tag `#feature-request`
   
4. **If/then branch:** Category = "account"
   - **Action:** Add tag `#account-privacy`
   
5. **If/then branch:** Category = "general"
   - **Action:** Add tag `#general-inquiry`

**How to create:**
1. Click **"Set up triggers"**
2. Select **"Ticket created"**
3. Click **"+"** to add action
4. Search for **"Set property value"**
5. Property: Tags
6. Value: Add your tag name
7. Click **"Save"**

#### Workflow 2: Priority Escalation

**Name:** "Flag High Priority Tickets"

**Trigger:**
- When: Ticket is created OR updated
- Filters: Priority = "High"

**Actions:**
1. Add tag: `#urgent`
2. (Optional) Send internal notification

### Step 7.2: Create Saved Views (Your "Queues")

Since you can't have teams, create **views** instead:

1. Go to: **Service** → **Tickets**
2. Click **"Save view"**
3. Create these views:

**View 1: Technical Support Queue**
- Name: "Technical Support"
- Filters: Tag contains `#technical-support` OR `#bug`
- Sort: Priority (high to low), Created date

**View 2: Billing Queue**
- Name: "Billing & Subscriptions"
- Filters: Tag contains `#billing`
- Sort: Created date

**View 3: General Inquiry Queue**
- Name: "General Inquiries"
- Filters: Tag contains `#general-inquiry`
- Sort: Created date

**View 4: My Open Tickets**
- Name: "My Tickets"
- Filters: Owner = You, Status ≠ Closed
- Sort: Priority, Created date

---

## 8. Configure Webhooks

Webhooks notify your app when tickets change in HubSpot.

### Step 8.1: Create Webhook Subscription

1. Go to: **Settings** → **Integrations** → **Private Apps**
2. Click on your app: **"Prompt & Pause Integration"**
3. Click **"Webhooks"** tab
4. Click **"Create subscription"**

### Step 8.2: Configure Subscription

**Target URL:**
```
https://promptandpause.com/api/webhooks/hubspot
```
(Use your actual domain - or `localhost` URL for testing with ngrok)

**Events to Subscribe:**
- ✅ `ticket.creation`
- ✅ `ticket.propertyChange`
- ✅ `ticket.deletion`

### Step 8.3: Get Webhook Signing Secret

1. After creating subscription, you'll see **"Client Secret"**
2. **Copy this secret** - you'll need it for webhook verification!

**Format:**
```
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 9. Get Your Credentials

Collect all these values - you'll add them to `.env.local`:

### 9.1: Portal ID
1. Go to any HubSpot page
2. Look at URL: `https://app.hubspot.com/contacts/[PORTAL_ID]/`
3. **Copy the number** (e.g., `12345678`)

### 9.2: Access Token
- From Step 5.3 (Private App creation)
- Starts with `pat-na1-...`

### 9.3: Pipeline ID
- From Step 3.3 (when you created pipeline)
- Found in URL when viewing pipeline

### 9.4: Stage IDs (Optional - for advanced mapping)
1. Go to pipeline settings
2. Click on a stage
3. Look at URL: `...&stageId=[STAGE_ID]`
4. Note IDs for: `open`, `in_progress`, `resolved`, `closed`

### 9.5: Webhook Signing Secret
- From Step 8.3 (webhook configuration)

---

## 10. Verify Setup

### Checklist:

✅ HubSpot account created (free tier)  
✅ Pipeline created: "Prompt & Pause Support"  
✅ Custom properties created (5 total)  
✅ Private app created with correct scopes  
✅ Access token copied and saved  
✅ Email forwarding configured  
✅ Automation workflows created (tag-based routing)  
✅ Saved views created (your "queues")  
✅ Webhook subscription created  
✅ All credentials collected  

### Test Email-to-Ticket:
1. Send test email to `support@promptandpause.com`
2. Check if it arrives in HubSpot as ticket
3. Verify it appears in correct view (based on tags)

---

## 11. Update Your .env.local

Add these values to your `.env.local` file:

```env
# HubSpot Service Hub - Free Tier Configuration
HUBSPOT_ACCESS_TOKEN=pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
HUBSPOT_PORTAL_ID=12345678
HUBSPOT_PIPELINE_ID=default_pipeline_id_here
HUBSPOT_SIGNING_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_HUBSPOT_ENABLED=false  # Keep false until integration is complete
```

**Stage IDs (for mapping - optional):**
```env
# Optional: If you want precise stage mapping
HUBSPOT_STAGE_NEW=stage_id_here
HUBSPOT_STAGE_OPEN=stage_id_here
HUBSPOT_STAGE_IN_PROGRESS=stage_id_here
HUBSPOT_STAGE_WAITING=stage_id_here
HUBSPOT_STAGE_RESOLVED=stage_id_here
HUBSPOT_STAGE_CLOSED=stage_id_here
```

---

## 12. HubSpot Free Tier Workarounds

Since you're on the free tier, here are workarounds for missing features:

### No Teams? Use Tags + Views
- ✅ Create tags for each "team"
- ✅ Use automation to auto-tag
- ✅ Create saved views filtered by tags
- ✅ Assign tickets manually to users

### No Advanced Automation? Use Basic Workflows
- ✅ Free tier allows simple workflows
- ✅ Focus on tag-based routing
- ✅ Handle complex logic in YOUR code

### Only 2 Users? Prioritize
- ✅ Admin user (you)
- ✅ Support person (if you have one)
- ✅ Handle team routing in your admin panel

### No SLAs? Track Manually
- ✅ Use priority tags
- ✅ Monitor response times in your system
- ✅ Send Slack alerts for old tickets

---

## 13. Common Issues & Troubleshooting

### Issue 1: Can't Find Pipeline ID
**Solution:**
1. Go to: **Settings** → **Objects** → **Tickets** → **Pipelines**
2. Click on your pipeline
3. URL contains: `pipelineId=XXXXX`

### Issue 2: Email Not Creating Tickets
**Solution:**
1. Check email forwarding is active
2. Verify HubSpot email address is correct
3. Check HubSpot spam folder
4. Ensure "Email to Ticket" is enabled in settings

### Issue 3: Webhook Not Receiving Events
**Solution:**
1. Verify webhook URL is publicly accessible
2. Check webhook subscription is active
3. Test with ngrok for local development
4. Verify signing secret matches

### Issue 4: Access Token Not Working
**Solution:**
1. Check token hasn't expired
2. Verify all required scopes are enabled
3. Regenerate token if needed (Settings → Private Apps)

---

## 14. Next Steps

Once you've completed this setup:

1. ✅ Run database migration (if not done)
2. ✅ Update `.env.local` with all credentials
3. ✅ Let me know you're ready
4. ✅ I'll build the integration code!

---

## 15. Useful HubSpot Resources

- **HubSpot Academy:** https://academy.hubspot.com/
- **API Documentation:** https://developers.hubspot.com/docs/api/overview
- **Community Forum:** https://community.hubspot.com/
- **Status Page:** https://status.hubspot.com/

---

## 16. Your HubSpot Free Tier Capabilities

What you **CAN** do with free tier:
- ✅ Unlimited tickets
- ✅ 2 users
- ✅ Email-to-ticket
- ✅ Basic automation (workflows)
- ✅ Custom properties
- ✅ Contact management (CRM)
- ✅ API access (Private Apps)
- ✅ Webhooks
- ✅ Saved views (queues)
- ✅ Tags for categorization
- ✅ Notes and timeline
- ✅ Mobile app

What you **CAN'T** do (needs paid):
- ❌ Teams (paid feature)
- ❌ Advanced automation
- ❌ Multiple pipelines
- ❌ SLA management
- ❌ Advanced reporting
- ❌ Conversation routing
- ❌ More than 2 users

**But:** Our workarounds give you 90% of team functionality for free! 🎉

---

## 📞 Questions?

If you encounter issues during setup:
1. Check HubSpot's documentation
2. Search community forums
3. Contact HubSpot support (they're helpful even on free tier!)
4. Let me know and I can adjust the integration

---

**Setup Complete!** 🎉

Once you've finished all steps above, we'll continue building the integration code!
