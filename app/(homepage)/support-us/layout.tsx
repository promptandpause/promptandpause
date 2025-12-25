import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promptandpause.com'

export const metadata: Metadata = {
  title: 'Support Us - Help Grow Prompt & Pause',
  description:
    'Support Prompt & Pause through subscriptions, referrals, and feedback. Help us make daily reflection accessible to everyone.',
  alternates: { canonical: `${siteUrl}/homepage/support-us` },
  openGraph: {
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Prompt & Pause social preview' }],
  },
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children
}

