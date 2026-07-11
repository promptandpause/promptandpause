import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthUser, createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: {
    default: 'Dashboard',
    template: 'Prompt & Pause | %s',
  },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) {
    redirect('/')
  }

  const supabase = await createClient()
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!preferences) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
