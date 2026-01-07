import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/server'
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
  // Get current user and session
  const supabase = await getCurrentUser()

  if (!supabase) {
    redirect('/admin-panel/login')
  }

  // Check admin access
  const hasAdminAccess = supabase.email ? await isAdminUser(supabase.email) : false
  if (!hasAdminAccess) {
    redirect('/dashboard')
  }

  // Check session timeout using session created_at
  if (supabase.created_at) {
    const sessionCreatedAt = new Date(supabase.created_at).getTime()
    const now = Date.now()
    const sessionAge = now - sessionCreatedAt

    if (sessionAge > ADMIN_SESSION_TIMEOUT_MS) {
      // Session expired, redirect to login
      redirect('/admin-panel/login?reason=session_expired')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar userEmail={supabase.email || ''} />
        
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
