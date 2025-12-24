# Project Cleanup & Organization Guide

## 📁 Recommended File Organization

### SQL Files → `/database` folder
Move all SQL migration and setup files to keep root clean:
- `setup_7day_trial.sql`
- `setup_email_queue.sql`
- `create_admin_users_table.sql`
- `create_maintenance_mode_table.sql`
- `create_maintenance_signout_trigger.sql`
- `create_support_tickets_tables.sql`
- `admin_dashboard_stats_functions.sql`
- `fix_profiles_table.sql`
- `focus_areas_reflection_count_update.sql`
- All other `*.sql` files

### Documentation → `/docs/archive` folder
Move completed implementation docs to archive:
- `PHASE_1_COMPLETE.md`
- `PHASE_2_COMPLETE.md`
- `CRITICAL_FIX_PROFILES.md`
- `PROMPT_GENERATION_FIX.md`
- `ADMIN_USER_SYSTEM_IMPLEMENTATION.md`

### Keep in Root
- `README.md` - Main project documentation
- `TRIAL_SYSTEM_SETUP.md` - Active system reference
- `WELCOME_EMAIL_SETUP.md` - Active system reference
- `EMAIL_VERIFICATION_FLOW.md` - Active system reference
- `IMPLEMENTATION_SUMMARY.md` - Current status overview

## 🗑️ Files to Consider Removing

### Temporary/Test Files
- `test-email-template.html` - Move to `/docs/templates` or delete
- `clear-storage.html` - Move to `/docs/utilities` or delete
- `test_analytics_data.sql` - Move to `/database/test` or delete

### Duplicate/Old Fixes
- `fix_all_email_templates.sql` (superseded by `final_fix_all_email_templates.sql`)
- `fix_duplicate_maintenance_rows.sql` (one-time fix, can archive)

### Build Artifacts
- `tsconfig.tsbuildinfo` - Can be regenerated, add to `.gitignore`
- `.next/` - Already in `.gitignore`, safe to delete locally

### Old Backups
- `backups_20251008_022144/` - Archive or delete if no longer needed

## ✅ Critical Systems Status

### ✓ Working Systems
1. **Authentication & Authorization**
   - Email/password signup with verification
   - Google OAuth SSO
   - Email verification flow
   - Admin user system

2. **Trial System**
   - 7-day premium trial after onboarding
   - Trial countdown timer (real-time)
   - Trial expiration cron job
   - Trial notification emails

3. **Subscription Management**
   - Free tier (7 prompts/week)
   - Premium tier (unlimited)
   - Subscription settings UI
   - Upgrade/downgrade flow

4. **Core Features**
   - Daily prompt generation (AI-powered)
   - Reflection creation & storage
   - Mood tracking & analytics
   - Achievement badges system
   - Streak tracking

5. **Email System**
   - Welcome emails (all signup methods)
   - Trial expiration warnings
   - Daily prompt reminders
   - Weekly digest emails
   - Email queue with retry logic

6. **Integrations**
   - Slack webhook delivery
   - Email + Slack dual delivery

7. **Admin Dashboard**
   - User management
   - Support tickets
   - Maintenance mode
   - Analytics & stats

### ⚠️ Needs Testing
- Admin login flow (pending email creation)
- Payment integration (if implemented)
- Export functionality (PDF/CSV)

## 🔧 Recommended Next Steps

1. **Organize Files**
   ```bash
   # Move SQL files
   mv *.sql database/
   
   # Move archived docs
   mv PHASE_*.md docs/archive/
   mv CRITICAL_FIX_*.md docs/archive/
   ```

2. **Update .gitignore**
   Add if not present:
   ```
   tsconfig.tsbuildinfo
   .DS_Store
   *.log
   .env*.local
   ```

3. **Clean Build**
   ```bash
   rm -rf .next
   npm run build
   ```

4. **Database Cleanup**
   - Run any pending migrations
   - Verify all tables exist
   - Check RLS policies are active

5. **Environment Variables**
   - Verify all required vars in `.env.local`
   - Update `.env.example` with new vars
   - Document any new integrations

## 📊 Project Health Metrics

- **Total API Routes**: ~50+
- **Database Tables**: ~15+
- **Cron Jobs**: 5 (daily prompts, weekly insights, trial expiry, welcome emails)
- **Email Templates**: 6+ (welcome, trial warning, trial expired, daily prompt, weekly digest)
- **Authentication Methods**: 2 (email/password, Google OAuth)
- **User Tiers**: 2 (free, premium) + trial state

## 🎯 Production Readiness

### Ready ✅
- Core reflection functionality
- Authentication & authorization
- Trial system
- Email notifications
- Cron jobs
- Admin dashboard

### Needs Review ⚠️
- Error handling & logging
- Rate limiting
- Database indexes
- Performance optimization
- Security audit
- Load testing

### Future Enhancements 🚀
- Mobile app
- Additional AI providers
- Advanced analytics
- Team/group features
- API for third-party integrations
