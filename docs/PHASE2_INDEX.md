# Phase 2: Email Templates & Maintenance Management - Complete Index

## 📋 Quick Reference

This document provides a complete index of all SQL migrations, documentation, and code files for Phase 2.

---

## 🗄️ Database Migration

### Primary Migration File
**Location:** `sql/migrations/phase2_email_maintenance.sql`

This is the **single migration file** you need to run. It includes:
- ✅ All 5 tables with indexes
- ✅ Triggers and functions
- ✅ RLS policies
- ✅ Seed data (3 default email templates)
- ✅ Performance optimization indexes

**Run this in Supabase SQL Editor:**
```bash
# Copy entire contents of this file and paste into Supabase SQL Editor
sql/migrations/phase2_email_maintenance.sql
```

### Tables Created
1. `email_templates` - Template definitions with versioning
2. `email_template_customizations` - Branding overrides (colors, logos)
3. `email_template_version_history` - Audit trail of all changes
4. `maintenance_windows` - Scheduled maintenance windows
5. `maintenance_status_cache` - Fast O(1) maintenance status lookups

---

## 📚 Documentation Files

### 1. Deployment Guide
**Location:** `docs/PHASE2_ROLLOUT.md`

Complete step-by-step deployment checklist including:
- Pre-deployment checklist
- Environment variables needed
- Database migration steps
- Post-deployment verification
- Rollback plan
- Common issues & solutions
- Monitoring recommendations
- Success criteria

### 2. This Index File
**Location:** `docs/PHASE2_INDEX.md`

Central reference for all Phase 2 files.

---

## 💻 Backend Code Files

### Service Layer
| File | Purpose |
|------|---------|
| `lib/services/emailTemplateService.ts` | Email template CRUD operations |
| `lib/services/maintenanceService.ts` | Maintenance window management |
| `lib/services/emailService.ts` | Email sending via Resend |
| `lib/utils/serverCache.ts` | Server-side caching utility |

### API Routes - Email Templates
| Route | File | Purpose |
|-------|------|---------|
| `GET /api/admin/email-templates` | `app/api/admin/email-templates/route.ts` | List all templates |
| `POST /api/admin/email-templates` | `app/api/admin/email-templates/route.ts` | Create new template |
| `GET /api/admin/email-templates/[id]` | `app/api/admin/email-templates/[id]/route.ts` | Get single template |
| `PUT /api/admin/email-templates/[id]` | `app/api/admin/email-templates/[id]/route.ts` | Update template |
| `DELETE /api/admin/email-templates/[id]` | `app/api/admin/email-templates/[id]/route.ts` | Delete template |
| `POST /api/admin/email-templates/[id]/preview` | `app/api/admin/email-templates/[id]/preview/route.ts` | Generate preview |
| `POST /api/admin/email-templates/[id]/test` | `app/api/admin/email-templates/[id]/test/route.ts` | Send test email |

### API Routes - Maintenance
| Route | File | Purpose |
|-------|------|---------|
| `GET /api/admin/maintenance` | `app/api/admin/maintenance/route.ts` | List maintenance windows |
| `POST /api/admin/maintenance` | `app/api/admin/maintenance/route.ts` | Create maintenance window |
| `GET /api/admin/maintenance/status` | `app/api/admin/maintenance/status/route.ts` | Get current status |
| `POST /api/admin/maintenance/enable` | `app/api/admin/maintenance/enable/route.ts` | Enable maintenance mode |
| `POST /api/admin/maintenance/disable` | `app/api/admin/maintenance/disable/route.ts` | Disable maintenance mode |
| `POST /api/admin/maintenance/[id]/cancel` | `app/api/admin/maintenance/[id]/cancel/route.ts` | Cancel scheduled window |

### Type Definitions
| File | Purpose |
|------|---------|
| `lib/types/emailTemplate.ts` | TypeScript types for email templates |
| `lib/types/maintenance.ts` | TypeScript types for maintenance windows |

---

## 🎨 Frontend UI Components

### Email Templates Admin Panel
**Base Path:** `app/admin-panel/email-templates/`

| Component | File | Purpose |
|-----------|------|---------|
| Main Page | `page.tsx` | Layout and state management |
| Template List | `components/TemplateList.tsx` | Sidebar list with filters |
| Editor | `components/EmailTemplateEditor.tsx` | Customization form |
| Preview | `components/EmailPreview.tsx` | HTML preview in iframe |
| Test Email | `components/SendTestEmail.tsx` | Test email form |
| Version History | `components/TemplateVersionHistory.tsx` | Change history with rollback |

### Maintenance Admin Panel
**Base Path:** `app/admin-panel/maintenance/`

| Component | File | Purpose |
|-----------|------|---------|
| Main Page | `page.tsx` | Layout and status banner |
| Status Control | `components/MaintenanceStatus.tsx` | Enable/disable toggle |
| Scheduler | `components/ScheduledMaintenance.tsx` | Create/view scheduled windows |
| History | `components/MaintenanceHistory.tsx` | Past maintenance events |

### Public Pages
| Page | File | Purpose |
|------|------|---------|
| Maintenance Page | `app/maintenance/page.tsx` | Public-facing maintenance message |

---

## 🔧 Configuration Files

### Middleware
**File:** `middleware.ts` (existing file)

Add maintenance mode check to middleware (if not already present):
```typescript
import { checkMaintenanceMode } from '@/lib/services/maintenanceService'

// In middleware function:
const maintenanceResult = await checkMaintenanceMode()
if (maintenanceResult.is_maintenance_mode) {
  return NextResponse.redirect(new URL('/maintenance', request.url))
}
```

### Environment Variables
Add to `.env.local`:
```env
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Your App Name
```

---

## 📊 Database Schema Reference

### Email Templates Table Structure
```sql
email_templates
├── id (UUID, PK)
├── template_key (TEXT, UNIQUE)
├── name (TEXT)
├── description (TEXT)
├── category (TEXT) - 'transactional', 'marketing', 'system', 'notification'
├── subject_template (TEXT)
├── body_template (TEXT)
├── variables (TEXT[])
├── is_active (BOOLEAN)
├── is_system (BOOLEAN)
├── created_at (TIMESTAMPTZ)
├── updated_at (TIMESTAMPTZ)
├── last_customized_at (TIMESTAMPTZ)
└── last_customized_by (UUID, FK)

email_template_customizations
├── id (UUID, PK)
├── template_id (UUID, FK)
├── logo_url (TEXT)
├── primary_color (TEXT)
├── secondary_color (TEXT)
├── background_color (TEXT)
├── button_text_color (TEXT)
├── custom_header_text (TEXT)
├── custom_footer_text (TEXT)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

email_template_version_history
├── id (UUID, PK)
├── template_id (UUID, FK)
├── changed_by (TEXT)
├── change_type (TEXT) - 'metadata', 'customization'
├── changes_json (JSONB)
├── notes (TEXT)
└── created_at (TIMESTAMPTZ)
```

### Maintenance Windows Table Structure
```sql
maintenance_windows
├── id (UUID, PK)
├── scheduled_date (DATE)
├── start_time (TIME)
├── end_time (TIME)
├── actual_start_time (TIMESTAMPTZ)
├── actual_end_time (TIMESTAMPTZ)
├── description (TEXT)
├── affected_services (TEXT[])
├── status (TEXT) - 'scheduled', 'active', 'completed', 'cancelled'
├── created_at (TIMESTAMPTZ)
├── created_by (UUID, FK)
├── updated_at (TIMESTAMPTZ)
├── completed_at (TIMESTAMPTZ)
└── cancelled_at (TIMESTAMPTZ)

maintenance_status_cache
├── id (INTEGER, PK) - Always 1 (single row)
├── is_maintenance_mode (BOOLEAN)
├── maintenance_window_id (UUID, FK)
└── last_checked_at (TIMESTAMPTZ)
```

---

## 🚀 Quick Start Commands

### 1. Run Database Migration
```bash
# In Supabase SQL Editor, paste contents of:
sql/migrations/phase2_email_maintenance.sql
```

### 2. Add Environment Variables
```bash
# Add to .env.local
RESEND_API_KEY=your_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Your App Name
```

### 3. Deploy Code
```bash
npm run build
vercel --prod  # or your deployment command
```

### 4. Verify Deployment
```bash
# Check templates loaded
curl https://yourapp.com/api/admin/email-templates

# Check maintenance status
curl https://yourapp.com/api/admin/maintenance/status
```

---

## 🔍 Finding Specific Files

### Need to modify email template logic?
→ `lib/services/emailTemplateService.ts`

### Need to change maintenance mode behavior?
→ `lib/services/maintenanceService.ts`

### Need to add/modify API endpoints?
→ `app/api/admin/email-templates/` or `app/api/admin/maintenance/`

### Need to update UI components?
→ `app/admin-panel/email-templates/components/` or `app/admin-panel/maintenance/components/`

### Need to adjust caching strategy?
→ `lib/utils/serverCache.ts`

### Need database schema changes?
→ Create new migration in `sql/migrations/` directory

### Need deployment instructions?
→ `docs/PHASE2_ROLLOUT.md`

---

## 📦 File Structure Overview

```
PandP/
├── app/
│   ├── admin-panel/
│   │   ├── email-templates/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── EmailTemplateEditor.tsx
│   │   │       ├── EmailPreview.tsx
│   │   │       ├── SendTestEmail.tsx
│   │   │       ├── TemplateList.tsx
│   │   │       └── TemplateVersionHistory.tsx
│   │   └── maintenance/
│   │       ├── page.tsx
│   │       └── components/
│   │           ├── MaintenanceStatus.tsx
│   │           ├── MaintenanceHistory.tsx
│   │           └── ScheduledMaintenance.tsx
│   ├── api/
│   │   └── admin/
│   │       ├── email-templates/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── preview/route.ts
│   │       │       └── test/route.ts
│   │       └── maintenance/
│   │           ├── route.ts
│   │           ├── status/route.ts
│   │           ├── enable/route.ts
│   │           ├── disable/route.ts
│   │           └── [id]/
│   │               └── cancel/route.ts
│   └── maintenance/
│       └── page.tsx
├── lib/
│   ├── services/
│   │   ├── emailTemplateService.ts
│   │   ├── maintenanceService.ts
│   │   └── emailService.ts
│   ├── types/
│   │   ├── emailTemplate.ts
│   │   └── maintenance.ts
│   └── utils/
│       └── serverCache.ts
├── sql/
│   └── migrations/
│       └── phase2_email_maintenance.sql  ⭐ MAIN MIGRATION FILE
└── docs/
    ├── PHASE2_INDEX.md  ⭐ THIS FILE
    └── PHASE2_ROLLOUT.md  ⭐ DEPLOYMENT GUIDE
```

---

## ✅ Pre-Deployment Checklist

Before deploying Phase 2, ensure:

- [ ] Reviewed migration SQL file
- [ ] Backed up production database
- [ ] Added environment variables (Resend API key)
- [ ] Admin users configured in database
- [ ] Code merged to production branch
- [ ] Tests passed (if applicable)
- [ ] Reviewed rollout documentation

---

## 📞 Support

For issues or questions:
1. Check `PHASE2_ROLLOUT.md` Common Issues section
2. Review API route error logs
3. Verify database migration completed successfully
4. Check admin authentication is working

---

**Last Updated:** 2025-10-21  
**Version:** 1.0  
**Phase:** 2 - Email Templates & Maintenance Management
