import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promptandpause.com'

export const metadata: Metadata = {
  title: 'Crisis Resources - Get Immediate Help',
  description:
    'Important mental health crisis resources, helplines, and support services. UK and US numbers for immediate assistance. You are not alone.',
  alternates: { canonical: `${siteUrl}/crisis-resources` },
  openGraph: {
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Prompt & Pause social preview' }],
  },
  robots: { index: true, follow: true },
}

export default function CrisisLayout({ children }: { children: React.ReactNode }) {
  return children
}
