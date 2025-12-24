import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promptandpause.com'

export const metadata: Metadata = {
  title: 'Support & Research - Evidence Behind Reflection and Mindfulness',
  description:
    'Evidence-based research on reflection and mental health. FAQs, getting started guides, and support resources.',
  alternates: { canonical: `${siteUrl}/homepage/research` },
  openGraph: {
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Prompt & Pause social preview' }],
  },
}

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
