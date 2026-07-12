import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/server'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: {
    default: 'Workspace',
    template: 'Prompt & Pause | %s',
  },
}

// Deliberately separate from app/dashboard/layout.tsx -- a user's personal
// dashboard code path never executes anything workspace-aware, and vice
// versa. See docs/architecture/WORKSPACE_B2B_ARCHITECTURE.md.
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) {
    redirect('/')
  }

  return <div className="min-h-screen">{children}</div>
}
