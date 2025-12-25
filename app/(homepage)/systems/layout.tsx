import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'System Status',
  description: 'Real-time monitoring of Prompt & Pause infrastructure and services. Check the health status of all critical systems.',
}

export default function SystemsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

