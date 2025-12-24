import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promptandpause.com'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'How Prompt & Pause uses cookies and similar technologies. Manage your cookie preferences and learn about data tracking.',
  alternates: { canonical: `${siteUrl}/homepage/cookie-policy` },
  openGraph: {
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Prompt & Pause social preview' }],
  },
  robots: { index: true, follow: true },
}

export default function CookieLayout({ children }: { children: React.ReactNode }) {
  return children
}
