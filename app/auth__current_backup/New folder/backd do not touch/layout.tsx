import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: {
    default: 'Authentication',
    template: 'Prompt & Pause | %s',
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
