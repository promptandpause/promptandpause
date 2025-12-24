import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: {
    default: 'Dashboard',
    template: 'Prompt & Pause | %s',
  },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
