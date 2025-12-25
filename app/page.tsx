import type { Metadata } from 'next'
import Homepage from './(homepage)/page';
import { organizationJsonLd, websiteJsonLd, premiumProductJsonLd } from '@/lib/structured-data'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promptandpause.com'

export const metadata: Metadata = {
  title: 'Prompt & Pause | Pause. Reflect. Grow.',
  description:
    'Personalized daily reflection prompts for when life feels too loud. Five minutes of guided introspection—delivered to your inbox each morning to help you process stress, track your mood, and rediscover calm.',
  alternates: { canonical: siteUrl + '/' },
  openGraph: {
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Prompt & Pause social preview' }],
  },
}

export default function RootPage() {
  const org = JSON.stringify(organizationJsonLd())
  const site = JSON.stringify(websiteJsonLd())
  const product = JSON.stringify(premiumProductJsonLd())

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: org }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: site }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: product }} />
      <Homepage />
    </>
  );
}
