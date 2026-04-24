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

/**
 * Server-side gate for all /dashboard routes.
 *
 * Guarantees that a user cannot render any dashboard page without:
 *   1. Being authenticated
 *   2. Having completed onboarding (i.e. a user_preferences row exists)
 *
 * This is defence-in-depth on top of the edge proxy check in `proxy.ts` —
 * if the proxy ever fails (cache, race, or config change) the user still
 * cannot reach the dashboard UI.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) {
    redirect('/login')
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

  return children
}
