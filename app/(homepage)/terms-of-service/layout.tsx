import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promptandpause.com'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms and conditions for using Prompt & Pause. User responsibilities, subscription terms, and service guidelines.',
  alternates: { canonical: `${siteUrl}/homepage/terms-of-service` },
  openGraph: {
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Prompt & Pause social preview' }],
  },
  robots: { index: true, follow: true },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}

