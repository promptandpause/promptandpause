# Phase 2 Rollout: Email Templates & Maintenance Management

## Overview
This document provides a comprehensive checklist and instructions for deploying Phase 2 features including:
- Email Template Management System
- Maintenance Window Management
- Admin UI Panels

---

## Pre-Deployment Checklist

### 1. Database Migration
- [ ] Review migration script: `sql/migrations/phase2_email_maintenance.sql`
- [ ] **Backup production database** before running migration
- [ ] Run migration in staging environment first
- [ ] Verify all tables created successfully:
  - `email_templates`
  - `email_template_customizations`
  - `email_template_version_history`
  - `maintenance_windows`
  - `maintenance_status_cache`
- [ ] Verify indexes created (check with `\di` in psql or Supabase dashboard)
- [ ] Verify triggers and functions are working
- [ ] Verify seed data inserted (3 default email templates)

### 2. Environment Variables
Add these to your environment configuration:

```env
# Email Configuration (if not already present)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Your App Name

# Rate Limiting (optional)
RATE_LIMIT_TEST_EMAILS=5  # Max test emails per hour per admin
RATE_LIMIT_WINDOW_MS=3600000  # 1 hour in milliseconds

# Cache Configuration (optional)
CACHE_TTL_TEMPLATES=300000  # 5 minutes in milliseconds
CACHE_TTL_MAINTENANCE=30000  # 30 seconds in milliseconds
```

### 3. Code Deployment
- [ ] Merge Phase 2 branch to main/production
- [ ] Verify all TypeScript files compile without errors
- [ ] Run linting: `npm run lint`
- [ ] Run type checking: `npm run type-check`
- [ ] Build production bundle: `npm run build`

### 4. Admin Access Configuration
- [ ] Verify admin authentication is configured
- [ ] Add admin users to `admin_users` table
- [ ] Test admin login and panel access
- [ ] Verify RLS policies allow admin CRUD operations

### 5. Email Service Testing
- [ ] Verify Resend API key is valid
- [ ] Send test email manually via API route
- [ ] Verify email delivery to inbox (check spam folder too)
- [ ] Test email template rendering with variables
- [ ] Test customization (colors, logo) application

### 6. Cache Configuration
- [ ] Server cache is enabled by default (in-memory)
- [ ] For production with multiple instances, consider Redis:
  - [ ] Set up Redis instance (e.g., Upstash, Redis Cloud)
  - [ ] Update `lib/utils/serverCache.ts` with Redis implementation
  - [ ] Add Redis connection string to environment variables

---

## Deployment Steps

### Step 1: Database Migration
```bash
# 1. Backup database (Supabase dashboard or pg_dump)
# 2. Run migration in Supabase SQL Editor
cat sql/migrations/phase2_email_maintenance.sql | psql $DATABASE_URL
```

### Step 2: Deploy Code
```bash
# 1. Build and deploy
npm run build
vercel --prod  # or your deployment command

# 2. Verify deployment
curl https://yourapp.com/api/health
```

### Step 3: Verify Email Templates
```bash
# Check templates were seeded
curl https://yourapp.com/api/admin/email-templates \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Expected: 3 templates (welcome_email, password_reset, daily_prompt)
```

### Step 4: Test Maintenance Mode
```bash
# Enable maintenance mode
curl -X POST https://yourapp.com/api/admin/maintenance/enable \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Verify middleware redirects users to /maintenance
curl https://yourapp.com/dashboard  # Should redirect to /maintenance

# Disable maintenance mode
curl -X POST https://yourapp.com/api/admin/maintenance/disable \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Step 5: Admin Panel Access
1. Navigate to `/admin-panel/email-templates`
2. Verify template list loads
3. Edit a template and save
4. Check version history appears
5. Send test email
6. Navigate to `/admin-panel/maintenance`
7. Schedule a maintenance window
8. Verify validation (weekend-only)

---

## Post-Deployment Verification

### Functional Testing
- [ ] Admin can view all email templates
- [ ] Admin can customize template colors and branding
- [ ] Admin can preview templates with sample data
- [ ] Admin can send test emails
- [ ] Admin can restore templates to defaults
- [ ] Version history tracks all changes
- [ ] Admin can enable/disable maintenance mode instantly
- [ ] Admin can schedule maintenance windows
- [ ] Weekend validation works correctly
- [ ] Maintenance history displays correctly
- [ ] Public maintenance page renders correctly

### Performance Testing
- [ ] Check database query performance
  ```sql
  -- Check index usage
  EXPLAIN ANALYZE SELECT * FROM email_templates WHERE template_key = 'welcome_email';
  EXPLAIN ANALYZE SELECT * FROM maintenance_windows WHERE status = 'active';
  ```
- [ ] Verify cache is working (check logs for cache hits)
- [ ] Test concurrent admin operations
- [ ] Monitor API response times

### Security Testing
- [ ] Verify non-admin users cannot access admin routes
- [ ] Verify RLS policies prevent unauthorized access
- [ ] Test SQL injection protection (Supabase handles this)
- [ ] Verify admin-only endpoints require authentication
- [ ] Test XSS protection in template editor

---

## Monitoring & Alerts

### Key Metrics to Monitor
1. **Email Template Performance**
   - Template fetch latency
   - Cache hit rate
   - Template rendering time
   - Test email send rate

2. **Maintenance Mode**
   - Status check latency
   - Middleware overhead
   - Schedule compliance (weekend-only)

3. **Database**
   - Query performance on indexed columns
   - Connection pool usage
   - Table size growth

### Recommended Logging
```typescript
// Add to your logging service
{
  event: 'email_template_updated',
  template_key: string,
  changed_by: string,
  duration_ms: number
}

{
  event: 'maintenance_mode_toggled',
  is_enabled: boolean,
  changed_by: string,
  timestamp: string
}
```

---

## Rollback Plan

### If Issues Arise During Deployment

#### 1. Code Rollback
```bash
# Revert to previous deployment
vercel rollback  # or your platform's rollback command
```

#### 2. Database Rollback (if necessary)
```sql
-- Drop new tables (only if absolutely necessary)
DROP TABLE IF EXISTS public.email_template_version_history CASCADE;
DROP TABLE IF EXISTS public.email_template_customizations CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.maintenance_status_cache CASCADE;
DROP TABLE IF EXISTS public.maintenance_windows CASCADE;
```

#### 3. Cache Clearance
```typescript
// Clear all caches via admin panel or API
await ServerCache.clear()
```

---

## Common Issues & Solutions

### Issue: Email templates not loading
**Solution:**
1. Check database connection
2. Verify RLS policies allow admin access
3. Check seed data was inserted
4. Clear server cache

### Issue: Maintenance mode not activating
**Solution:**
1. Check `maintenance_status_cache` table exists
2. Verify trigger is working
3. Check middleware is enabled in `middleware.ts`
4. Clear cache and retry

### Issue: Admin panel shows 403 Forbidden
**Solution:**
1. Verify admin user exists in `admin_users` table
2. Check authentication token is valid
3. Verify RLS policies allow admin operations
4. Check `checkAdminAuth` function logic

### Issue: Test emails not sending
**Solution:**
1. Verify Resend API key is valid
2. Check from email is verified in Resend dashboard
3. Review rate limiting (max 5 per hour)
4. Check email template variables are correct

---

## Performance Optimization

### Recommended Index Maintenance
```sql
-- Periodically analyze tables for query optimization
ANALYZE email_templates;
ANALYZE maintenance_windows;
ANALYZE email_template_version_history;

-- Check for unused indexes (after 1 month in production)
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;
```

### Cache Tuning
- Adjust TTL based on usage patterns
- Monitor cache hit/miss ratio
- Consider Redis for multi-instance deployments

### Database Cleanup
```sql
-- Archive old version history (keep last 100 versions per template)
DELETE FROM email_template_version_history
WHERE id NOT IN (
  SELECT id FROM email_template_version_history
  WHERE template_id = $1
  ORDER BY created_at DESC
  LIMIT 100
);

-- Clean up old completed maintenance windows (older than 90 days)
DELETE FROM maintenance_windows
WHERE status IN ('completed', 'cancelled')
  AND scheduled_date < NOW() - INTERVAL '90 days';
```

---

## Support & Escalation

### Contact Points
- **Database Issues:** DBA/DevOps team
- **Email Delivery Issues:** Resend support
- **Application Bugs:** Development team
- **Admin Access Issues:** Security team

### Escalation Criteria
- Maintenance mode stuck enabled
- Email templates not loading for 5+ minutes
- Database migration failures
- Security vulnerabilities discovered

---

## Success Criteria

Phase 2 deployment is successful when:
- [ ] All admin users can access admin panels
- [ ] Email templates can be customized and saved
- [ ] Test emails are delivered successfully
- [ ] Maintenance mode can be toggled instantly
- [ ] Maintenance windows can be scheduled
- [ ] Public maintenance page displays correctly
- [ ] No performance degradation observed
- [ ] All monitoring alerts are green
- [ ] Cache hit rate > 80% for templates
- [ ] Maintenance status check < 50ms

---

## Next Steps

After successful Phase 2 deployment:
1. Monitor logs for 24-48 hours
2. Collect admin user feedback
3. Fine-tune cache TTLs based on usage
4. Consider Redis migration if scaling issues arise
5. Plan Phase 3 features (if applicable)

---

## Maintenance Schedule

### Daily
- Monitor error logs
- Check email delivery success rate
- Verify cache performance

### Weekly
- Review maintenance windows compliance
- Check database query performance
- Archive old version history

### Monthly
- Review and optimize indexes
- Clean up old maintenance records
- Audit admin access logs
- Performance tuning based on metrics

---

**Last Updated:** 2025-10-20  
**Version:** 1.0  
**Author:** Development Team
