import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminRole, isAdminUser, updateLastLogin } from '@/lib/services/adminUserService'
import { getAdminSession } from '@/lib/services/adminAuth'
import AdminSidebar from './components/AdminSidebar'

export const metadata = {
  title: 'Admin Panel | Prompt & Pause',
  description: 'Admin dashboard for managing users, analytics, and system settings',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check for OTP session first
  const otpSession = await getAdminSession()
  if (otpSession) {
    const adminUser = otpSession.admin_users
    
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="flex h-screen overflow-hidden">
          <AdminSidebar userEmail={adminUser.email || ''} userRole={adminUser.role || 'employee'} />
          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-gray-50">
            <div className="w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Check for Supabase auth (password method)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin-login')
  }

  // Check admin access
  const hasAdminAccess = user.email ? await isAdminUser(user.email) : false
  if (!hasAdminAccess) {
    redirect('/')
  }

  const adminRole = user.email ? await getAdminRole(user.email) : null

  if (user.email) {
    await updateLastLogin(user.email)
  }

  // Validate actual auth session expiry (do not use user.created_at)
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/admin-login')
  }

  if (session.expires_at && Date.now() > session.expires_at * 1000) {
    redirect('/admin-login?reason=session_expired')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar userEmail={user.email || ''} userRole={adminRole || 'employee'} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-gray-50">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
