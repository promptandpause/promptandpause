import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/services/adminUserService'
import AdminSidebar from './components/AdminSidebar'

export const metadata = {
  title: 'Admin Panel | Prompt & Pause',
  description: 'Admin dashboard for managing users, analytics, and system settings',
  robots: { index: false, follow: false },
}

// Admin session timeout: 1 hour
const ADMIN_SESSION_TIMEOUT_MS = 60 * 60 * 1000

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    redirect('/dashboard')
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
        <AdminSidebar userEmail={user.email || ''} />
        
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
