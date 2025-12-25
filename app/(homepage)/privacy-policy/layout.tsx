import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promptandpause.com'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Prompt & Pause collects, uses, and protects your personal data. GDPR compliant. Your reflections are private and encrypted.',
  alternates: { canonical: `${siteUrl}/homepage/privacy-policy` },
  openGraph: {
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Prompt & Pause social preview' }],
  },
  robots: { index: true, follow: true },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}

