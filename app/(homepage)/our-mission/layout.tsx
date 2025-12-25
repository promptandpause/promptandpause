import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promptandpause.com'

export const metadata: Metadata = {
  title: 'Our Mission - Why We Built Prompt & Pause',
  description:
    "Mental health support shouldn't be overwhelming, expensive, or one-size-fits-all. Learn why we built Prompt & Pause and who it's for.",
  alternates: { canonical: `${siteUrl}/homepage/our-mission` },
  openGraph: {
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Prompt & Pause social preview' }],
  },
}

export default function MissionLayout({ children }: { children: React.ReactNode }) {
  return children
}
