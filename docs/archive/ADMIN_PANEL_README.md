# Admin Panel - Quick Reference

## 🚀 Getting Started

### 1. Database Setup
```bash
# Open Supabase SQL Editor at: https://supabase.com/dashboard
# Copy and paste the entire contents of: ADMIN_PANEL_MIGRATIONS.sql
# Click "Run"
```

### 2. Configure Admin Access
```bash
# Edit .env.local
ADMIN_EMAIL=your-admin-email@example.com
```

### 3. Start Development
```bash
npm run dev
# Visit: http://localhost:3000/admin-panel
```

---

## 📁 File Structure

```
app/
├── admin-panel/
│   ├── layout.tsx                    # ✅ Admin layout with sidebar
│   ├── page.tsx                      # ✅ Dashboard overview
│   ├── components/
│   │   └── AdminSidebar.tsx         # ✅ Navigation sidebar
│   ├── users/                        # 🚧 TO DO
│   │   ├── page.tsx                 # User list table
│   │   └── [id]/page.tsx            # User detail view
│   ├── analytics/                    # 🚧 TO DO
│   │   └── page.tsx                 # Analytics dashboard
│   └── activity/                     # 🚧 TO DO
│       └── page.tsx                 # Activity logs
│
├── api/admin/
│   ├── dashboard/
│   │   ├── stats/route.ts           # ✅ Dashboard metrics
│   │   └── activity/route.ts        # ✅ Recent activity
│   ├── users/                        # 🚧 TO DO
│   │   ├── route.ts                 # List users
│   │   ├── export/route.ts          # Export CSV
│   │   └── [id]/route.ts            # User CRUD
│   └── analytics/                    # 🚧 TO DO
│       └── ...
│
lib/services/
└── adminService.ts                   # ✅ Admin business logic

ADMIN_PANEL_MIGRATIONS.sql           # ✅ Database schema
```

---

## 🔑 Key Features Implemented

### ✅ Authentication & Security
- Middleware protection for `/admin-panel` routes
- Server-side admin verification
- Activity logging for audit trail
- RLS policies on all tables
- Service role client for admin operations

### ✅ Dashboard
- **Metrics:**
  - Monthly Recurring Revenue (MRR)
  - Total users (Free vs Premium breakdown)
  - Engagement rate
  - New signups (30 days)
  - Conversion rate
  - Average prompts per user
  - ARPU (Average Revenue Per User)

- **Recent Activity Feed:**
  - New user signups
  - Subscription changes
  - Real-time updates

---

## 🔧 Admin Service Functions

```typescript
// Import the admin service
import * as adminService from '@/lib/services/adminService'

// Check if user is admin
adminService.isAdminEmail('user@example.com')

// Get all users with filters
await adminService.getAllUsers({
  limit: 50,
  offset: 0,
  subscription_status: 'premium',
  activity_status: 'active',
  search: 'john@example.com',
  sort_by: 'signup_date',
  sort_order: 'desc'
})

// Get single user
await adminService.getUserById(userId)

// Update user profile
await adminService.updateUserProfile(userId, {
  full_name: 'New Name',
  email: 'new@example.com'
}, adminEmail)

// Delete user
await adminService.deleteUser(userId, adminEmail)

// Log admin action
await adminService.logAdminActivity({
  admin_email: 'admin@example.com',
  action_type: 'user_updated',
  target_user_id: userId,
  target_user_email: 'user@example.com',
  details: { field: 'email', from: 'old@ex.com', to: 'new@ex.com' }
})

// Get dashboard stats
await adminService.getDashboardStats()

// Get recent activity
await adminService.getRecentActivity(20)

// Export users to CSV
const csv = adminService.usersToCSV(users)
```

---

## 🎨 UI Component Patterns

### Status Badges
```tsx
// Premium user
<Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-400/30">
  Premium
</Badge>

// Free user
<Badge className="bg-blue-500/10 text-blue-400 border-blue-400/30">
  Free
</Badge>

// Active user
<Badge className="bg-green-500/10 text-green-400 border-green-400/30">
  Active
</Badge>

// Inactive user
<Badge className="bg-slate-500/10 text-slate-400 border-slate-400/30">
  Inactive
</Badge>

// Cancelled subscription
<Badge className="bg-red-500/10 text-red-400 border-red-400/30">
  Cancelled
</Badge>
```

### Card Pattern
```tsx
<Card className="bg-slate-800/50 border-slate-700">
  <div className="p-6">
    {/* Card content */}
  </div>
</Card>
```

### Color Scheme
- **Background:** `bg-slate-950` → `bg-slate-900` → `bg-slate-800`
- **Borders:** `border-slate-700` or `border-slate-800`
- **Text:** 
  - Primary: `text-white`
  - Secondary: `text-slate-400`
  - Tertiary: `text-slate-500`

---

## 🔐 Security Features

### Privacy Guarantees
- ❌ **NEVER exposed:** User reflection content, AI insights, sentiment scores
- ✅ **Available:** Email, name, subscription status, dates, engagement metrics, counts

### Authentication Flow
1. User signs in
2. Middleware checks if route starts with `/admin-panel`
3. Middleware verifies user email matches `ADMIN_EMAIL`
4. Layout performs server-side verification
5. API routes check admin auth on every request

### Audit Trail
All admin actions logged to `admin_activity_logs`:
- Who performed the action (admin email)
- What action was performed
- Which user was affected
- When it happened
- Additional details (JSON)

---

## 📊 Database Schema

### Tables
- `user_preferences` - User settings
- `admin_activity_logs` - Audit trail
- `cron_job_runs` - Job execution history
- `prompt_library` - Reusable prompts

### Views
- `admin_user_stats` - Aggregated user metrics

### Functions
- `calculate_mrr()` - Calculate Monthly Recurring Revenue
- `get_engagement_stats(days_back)` - Get engagement metrics

---

## 🧪 Testing Guide

### Manual Testing Checklist

**Authentication:**
- [ ] Admin can access `/admin-panel`
- [ ] Non-admin redirected to `/dashboard`
- [ ] Unauthenticated redirected to `/auth/signin`

**Dashboard:**
- [ ] All stat cards display correct values
- [ ] Recent activity shows latest signups/subscriptions
- [ ] Loading states work
- [ ] Error states display properly

**API Endpoints:**
```bash
# Test dashboard stats (replace with your auth token)
curl http://localhost:3000/api/admin/dashboard/stats \
  -H "Cookie: your-session-cookie"

# Test recent activity
curl http://localhost:3000/api/admin/dashboard/activity \
  -H "Cookie: your-session-cookie"
```

---

## 🐛 Troubleshooting

### Issue: Can't access admin panel
**Solution:** 
1. Check `.env.local` has correct `ADMIN_EMAIL`
2. Ensure you're signed in with that email
3. Restart dev server after changing env variables

### Issue: SQL migrations fail
**Solution:**
1. Check if tables already exist
2. If updating, use `ALTER TABLE` statements individually
3. Verify `uuid-ossp` extension is enabled

### Issue: Dashboard shows no data
**Solution:**
1. Verify database has users/data
2. Check browser console for API errors
3. Verify RLS policies are set correctly
4. Ensure service role key is in `.env.local`

---

## 📈 Next Phase Features

### Phase 2 (Upcoming):
- Complete user management (list, detail, edit, delete)
- Analytics dashboard with charts
- Activity logs viewer
- Email management
- Cron job monitoring

### Phase 3 (Future):
- Subscription management
- Manual prompt sending
- Prompt library management
- Support ticket system
- System health monitoring

---

## 💡 Pro Tips

1. **Use Service Role Wisely:** Only use in admin API routes, never expose to client
2. **Log Everything:** All admin actions should call `logAdminActivity()`
3. **Validate Inputs:** Use Zod schemas for API request validation
4. **Privacy First:** Never expose reflection content in admin views
5. **Error Handling:** Always show user-friendly error messages

---

## 📞 Support

For issues or questions:
1. Check `ADMIN_PANEL_PHASE1_STATUS.md` for detailed implementation status
2. Review this README for quick reference
3. Inspect browser console and server logs for errors

---

**Last Updated:** Phase 1 - Foundation Complete  
**Next Steps:** User Management Implementation
