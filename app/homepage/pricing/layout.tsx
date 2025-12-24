import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promptandpause.com'

export const metadata: Metadata = {
  title: 'Pricing - Simple Plans for Daily Reflection',
  description:
    'Start free forever with 3 weekly prompts, or upgrade to Premium for £12/month (£120/year) with daily prompts, insights, and advanced features.',
  alternates: { canonical: `${siteUrl}/homepage/pricing` },
  openGraph: {
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Prompt & Pause social preview' }],
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
