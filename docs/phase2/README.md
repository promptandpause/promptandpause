# Phase 2: Email Templates & Maintenance Management

## 🎯 What's in Phase 2?

This phase adds two major admin features:
1. **Email Template Management** - Customize and manage all system emails
2. **Maintenance Window Management** - Schedule and control site maintenance mode

---

## 📚 Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| **📋 PHASE2_INDEX.md** | Complete file index and reference | `docs/PHASE2_INDEX.md` |
| **🚀 PHASE2_ROLLOUT.md** | Deployment guide and checklist | `docs/PHASE2_ROLLOUT.md` |

---

## 🗄️ Database Migration

**Single migration file:** `sql/migrations/phase2_email_maintenance.sql`

This file contains everything you need:
- ✅ 5 tables with optimized indexes
- ✅ Triggers and functions
- ✅ RLS policies
- ✅ Seed data (3 default templates)

**To deploy:**
1. Backup your database
2. Copy contents of migration file
3. Paste into Supabase SQL Editor
4. Run the migration

---

## 🎨 Admin Panels

### Email Templates Panel
**URL:** `/admin-panel/email-templates`

Features:
- List all email templates with category filters
- Customize colors, logos, and branding
- Preview templates with sample data
- Send test emails
- View version history and rollback changes

### Maintenance Panel
**URL:** `/admin-panel/maintenance`

Features:
- Enable/disable maintenance mode instantly
- Schedule maintenance windows (weekends only)
- View maintenance history
- Cancel scheduled maintenance

---

## 🔧 Environment Setup

Add these to your `.env.local`:

```env
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Your App Name
```

---

## 🚀 Quick Deploy Steps

1. **Run migration** - Copy `sql/migrations/phase2_email_maintenance.sql` to Supabase
2. **Add env vars** - Resend API key and email settings
3. **Deploy code** - `npm run build && vercel --prod`
4. **Verify** - Access admin panels and test functionality

---

## 📁 Key Files

### Most Important
- `sql/migrations/phase2_email_maintenance.sql` - Database migration
- `docs/PHASE2_INDEX.md` - Complete file reference
- `docs/PHASE2_ROLLOUT.md` - Deployment guide

### Backend Services
- `lib/services/emailTemplateService.ts` - Email template CRUD
- `lib/services/maintenanceService.ts` - Maintenance management
- `lib/utils/serverCache.ts` - Caching layer

### Admin UI
- `app/admin-panel/email-templates/` - Email template UI
- `app/admin-panel/maintenance/` - Maintenance UI

### API Routes
- `app/api/admin/email-templates/` - Email template endpoints
- `app/api/admin/maintenance/` - Maintenance endpoints

---

## ✅ Post-Deploy Verification

After deployment, verify:
- [ ] Admin can access `/admin-panel/email-templates`
- [ ] Admin can access `/admin-panel/maintenance`
- [ ] Email templates load correctly
- [ ] Test email sends successfully
- [ ] Maintenance mode can be toggled
- [ ] Maintenance windows can be scheduled

---

## 🆘 Need Help?

1. **File not found?** → Check `PHASE2_INDEX.md` for complete file listing
2. **Deployment issues?** → Review `PHASE2_ROLLOUT.md` Common Issues section
3. **Database errors?** → Verify migration ran successfully in Supabase
4. **API errors?** → Check admin authentication and RLS policies

---

## 📊 What Gets Created

### Database Tables
1. `email_templates` - Template definitions
2. `email_template_customizations` - Branding overrides
3. `email_template_version_history` - Audit trail
4. `maintenance_windows` - Scheduled maintenance
5. `maintenance_status_cache` - Fast status lookups

### Default Templates
1. **Welcome Email** - Sent to new users
2. **Password Reset** - Password recovery emails
3. **Daily Prompt** - Reflection prompt emails

---

## 🎓 Features Overview

### Email Template Management
- ✅ Customize colors, logos, and branding
- ✅ Preview templates with sample data
- ✅ Send test emails (rate-limited)
- ✅ Version history with rollback
- ✅ Category filtering
- ✅ Variable validation

### Maintenance Management
- ✅ Instant enable/disable toggle
- ✅ Schedule future maintenance (weekend-only)
- ✅ View maintenance history
- ✅ Cancel scheduled maintenance
- ✅ Public maintenance page
- ✅ Middleware-based redirects

---

**Phase:** 2  
**Status:** Ready for Deployment  
**Last Updated:** 2025-10-21
