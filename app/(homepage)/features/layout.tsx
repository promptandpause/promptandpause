import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promptandpause.com'

export const metadata: Metadata = {
  title: 'Features - Calm daily reflection prompts',
  description:
    'Daily prompts, flexible delivery, a private archive, and gentle weekly/monthly perspective—designed for quiet, consistent reflection without pressure.',
  alternates: { canonical: `${siteUrl}/homepage/features` },
  openGraph: {
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Prompt & Pause social preview' }],
  },
}

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children
}

