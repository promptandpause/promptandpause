# Admin User Management System - Implementation Guide

## Overview
Role-based admin system with three tiers:
- **Super Admin**: Full system access including API/backend management
- **Admin**: Can create other admins, full admin panel access
- **Employee**: Limited access to assigned features

**Domain Lock**: All admin users must have `@promptandpause.com` email addresses.

---

## ✅ Completed Components

### 1. Database Schema
**File**: `create_admin_users_table.sql`

**Tables Created**:
- `admin_users` - Stores admin user records with roles
- `admin_activity_log` - Audit trail for all admin actions

**Key Features**:
- Email domain validation constraint
- Role-based access control (super_admin, admin, employee)
- Activity logging with RLS policies
- Helper functions for role checking

**Action Required**: Run this SQL script in Supabase SQL Editor

### 2. Admin User Service
**File**: `lib/services/adminUserService.ts`

**Functions Implemented**:
- `createAdminUser()` - Create new admin with auto-generated password
- `getAllAdminUsers()` - List all admin users
- `getAdminUserByEmail()` - Get specific admin user
- `updateAdminUser()` - Update admin user details
- `updateAdminPassword()` - Change password (self or by manager)
- `updateAdminEmail()` - Update email (super admin only)
- `deactivateAdminUser()` - Deactivate admin account
- `isAdminUser()` - Check if user has admin access
- `getAdminRole()` - Get user's role
- `isSuperAdmin()` - Check super admin status
- `canCreateAdmins()` - Check permission to create admins
- `canManageUser()` - Check permission to manage specific user

**Permission Logic**:
- Super admins can manage anyone
- Admins can manage other admins and employees (not super admins)
- Users can update their own passwords
- Only super admins can update emails

### 3. Email Template
**File**: `lib/services/emailService.ts`

**Function**: `sendAdminCredentialsEmail()`
- Professional welcome email with credentials
- Security instructions
- Role-specific access information
- Direct link to admin panel sign-in

---

## 🚧 Pending Implementation

### 4. API Endpoints
**Location**: `app/api/admin/users/`

**Endpoints Needed**:

```typescript
// GET /api/admin/users - List all admin users
// POST /api/admin/users - Create new admin user
// GET /api/admin/users/[id] - Get specific admin user
// PATCH /api/admin/users/[id] - Update admin user
// DELETE /api/admin/users/[id] - Deactivate admin user
// PATCH /api/admin/users/[id]/password - Update password
// PATCH /api/admin/users/[id]/email - Update email (super admin only)
```

**Authentication Flow**:
1. Verify user is authenticated
2. Check user has admin access via `isAdminUser()`
3. Check specific permissions for action
4. Log activity to audit trail
5. Send email if creating new user

### 5. Middleware Updates
**File**: `proxy.ts`

**Changes Needed**:
1. Replace `ADMIN_EMAIL` check with `isAdminUser()` from adminUserService
2. Add role-based route protection:
   - `/admin-panel/settings` - Super admin only
   - `/admin-panel/users` - Super admin and admin only
   - `/admin-panel/*` - All admin roles

**Example**:
```typescript
// Check if user is admin
const isAdmin = await isAdminUser(user.email)
if (!isAdmin && pathname.startsWith('/admin-panel')) {
  return NextResponse.redirect(new URL('/dashboard', request.url))
}

// Check super admin for sensitive routes
if (pathname.startsWith('/admin-panel/settings')) {
  const isSuperAdminUser = await isSuperAdmin(user.email)
  if (!isSuperAdminUser) {
    return NextResponse.redirect(new URL('/admin-panel', request.url))
  }
}
```

### 6. Admin User Management UI
**Location**: `app/admin-panel/users/page.tsx`

**Features**:
- Table view of all admin users
- Filter by role, status, department
- Create new admin user modal
- Edit user details
- Deactivate/reactivate users
- View activity log
- Role badges with color coding

**Permissions**:
- Super admins see all users
- Admins see admins and employees (not super admins)
- Create button only for super admin and admin roles

### 7. Admin Profile Management
**Location**: `app/admin-panel/profile/page.tsx`

**Features**:
- View own profile details
- Update password form
- Cannot change own email (shows read-only)
- Last login timestamp
- Activity history

**Super Admin Additional Features**:
- Can update own email
- Can see all system settings

### 8. AuthGuard Updates
**File**: `lib/hooks/useAuthGuard.ts` and `components/auth/AuthGuard.tsx`

**New Props**:
```typescript
interface AuthGuardProps {
  children: ReactNode
  redirectPath?: string
  requireAdmin?: boolean
  requireSuperAdmin?: boolean  // NEW
  requireRole?: AdminRole      // NEW
}
```

**Logic**:
- Check authentication first
- If `requireAdmin`, verify user is in admin_users table
- If `requireSuperAdmin`, verify role is super_admin
- If `requireRole`, verify user has specific role

### 9. Admin Panel Navigation Updates
**File**: `app/admin-panel/layout.tsx` or sidebar component

**New Menu Items**:
- "Admin Users" - Only visible to super admin and admin
- "My Profile" - Visible to all admin users
- "System Settings" - Only visible to super admin

---

## 🔐 Security Considerations

### Domain Validation
- Email validation enforced at database level
- Additional validation in service layer
- Cannot create accounts outside @promptandpause.com

### Password Security
- Auto-generated 16-character passwords
- Includes uppercase, lowercase, numbers, symbols
- Sent via secure email
- Must be changed on first login (recommended)

### Audit Trail
- All admin actions logged to `admin_activity_log`
- Includes: who, what, when, target, details
- Cannot be deleted (only super admin can view all)

### Role Hierarchy
```
Super Admin (full access)
    ├── Can manage: Super Admins, Admins, Employees
    ├── Can update emails
    └── Can access system settings

Admin (panel access + user management)
    ├── Can manage: Admins, Employees
    ├── Cannot manage: Super Admins
    └── Cannot update emails

Employee (limited access)
    ├── Can view assigned features
    └── Can update own password only
```

---

## 📋 Implementation Checklist

### Phase 1: Core Setup
- [x] Create database schema
- [x] Create admin user service
- [x] Create email template
- [ ] Run SQL script in Supabase
- [ ] Create initial super admin record

### Phase 2: API Layer
- [ ] Create `/api/admin/users` endpoints
- [ ] Add authentication checks
- [ ] Add role-based permissions
- [ ] Add activity logging
- [ ] Test all endpoints

### Phase 3: Middleware
- [ ] Update proxy.ts with admin user checks
- [ ] Add role-based route protection
- [ ] Test access control

### Phase 4: UI Components
- [ ] Create admin users list page
- [ ] Create admin user creation modal
- [ ] Create admin profile page
- [ ] Update AuthGuard for roles
- [ ] Update admin panel navigation
- [ ] Test all UI flows

### Phase 5: Testing
- [ ] Test super admin can do everything
- [ ] Test admin can create admins but not super admins
- [ ] Test employee has limited access
- [ ] Test domain validation
- [ ] Test password updates
- [ ] Test email updates (super admin only)
- [ ] Test deactivation
- [ ] Test audit logging

---

## 🚀 Quick Start

### 1. Set Up Database
```sql
-- Run in Supabase SQL Editor
\i create_admin_users_table.sql

-- Create your first super admin (update with your details)
INSERT INTO admin_users (user_id, email, full_name, role, created_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Super Admin'),
  'super_admin',
  NOW()
FROM auth.users
WHERE email = 'your-email@promptandpause.com'
ON CONFLICT (email) DO NOTHING;
```

### 2. Environment Variables
Ensure these are set:
```env
ADMIN_EMAIL=your-email@promptandpause.com  # Keep for backward compatibility
RESEND_API_KEY=your-resend-key
RESEND_FROM_EMAIL=prompts@promptandpause.com
```

### 3. Test Access
1. Sign in with your super admin account
2. Navigate to `/admin-panel`
3. Should see full access to all features

---

## 📝 Next Steps

**Immediate**:
1. Review this implementation plan
2. Confirm approach and permissions structure
3. Run database SQL script
4. Create initial super admin record

**Then**:
1. Implement API endpoints
2. Update middleware
3. Build UI components
4. Test thoroughly

**Questions to Consider**:
- Do you want 2FA for admin accounts?
- Should there be a "view-only" admin role?
- Do you want email notifications when new admins are created?
- Should admins be able to see each other's activity logs?
- Do you want session timeout for admin users?

---

## 🔗 Related Files

**Database**:
- `create_admin_users_table.sql` - Schema and setup
- `create_support_tickets_tables.sql` - Support system (already created)
- `create_maintenance_mode_table.sql` - Maintenance system (already created)

**Services**:
- `lib/services/adminUserService.ts` - Admin user management
- `lib/services/adminService.ts` - General admin operations
- `lib/services/emailService.ts` - Email sending (includes admin credentials)

**Middleware**:
- `proxy.ts` - Authentication and routing (needs updates)

**Components**:
- `lib/hooks/useAuthGuard.ts` - Auth guard hook (needs role support)
- `components/auth/AuthGuard.tsx` - Auth guard component (needs role support)

---

This system provides enterprise-grade admin user management with proper security, audit trails, and role-based access control. All admin operations are logged, and the domain lock ensures only authorized personnel can access the admin panel.
