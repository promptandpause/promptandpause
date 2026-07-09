import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getAdminRole, isAdminUser, updateLastLogin } from '@/lib/services/adminUserService'
import crypto from 'crypto'
import AdminSidebar from './components/AdminSidebar'

export const metadata = {
  title: 'Admin Panel | Prompt & Pause',
  description: 'Admin dashboard for managing users, analytics, and system settings',
  robots: { index: false, follow: false },
}

// Admin session timeout: 1 hour
const ADMIN_SESSION_TIMEOUT_MS = 60 * 60 * 1000

async function getAdminSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('admin_session')?.value

  if (!sessionToken) {
    return null
  }

  const supabase = createServiceRoleClient()
  const sessionHash = crypto.createHash('sha256').update(sessionToken).digest('hex')

  const { data: session, error } = await supabase
    .from('admin_sessions')
    .select('*, admin_users!inner(id, email, full_name, role, is_active)')
    .eq('session_token', sessionHash)
    .single()

  if (error || !session) {
    return null
  }

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from('admin_sessions').delete().eq('id', session.id)
    return null
  }

  // Check if admin user is still active
  if (!session.admin_users.is_active) {
    return null
  }

  return session
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
      <div className="min-h-screen bg-white">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <AdminSidebar userEmail={adminUser.email || ''} userRole={adminUser.role || 'employee'} />
          
          {/* Main content area */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
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
    <div className="min-h-screen bg-white">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar userEmail={user.email || ''} userRole={adminRole || 'employee'} />
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
