import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promptandpause.com'

export const metadata: Metadata = {
  title: 'Features - AI-Personalized Prompts and Mood Tracking',
  description:
    'AI-personalized prompts, flexible delivery, mood tracking, searchable archive, and streak tracking. Simple tools designed for busy minds.',
  alternates: { canonical: `${siteUrl}/homepage/features` },
  openGraph: {
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Prompt & Pause social preview' }],
  },
}

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children
}

