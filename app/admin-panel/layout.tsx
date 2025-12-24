import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/server'
import { isAdminUser } from '@/lib/services/adminUserService'
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
  // Double-check admin authentication on the server
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin?redirect=/admin-panel')
  }

  const hasAdminAccess = user.email ? await isAdminUser(user.email) : false
  if (!hasAdminAccess) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar userEmail={user.email || ''} />
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-slate-900">
          <div className="container mx-auto p-6 md:p-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
