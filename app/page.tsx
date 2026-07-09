import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/server'
import { organizationJsonLd, websiteJsonLd, premiumProductJsonLd } from '@/lib/structured-data'
import Homepage from './(homepage)/page'
import AuthHomeRedirect from './AuthHomeRedirect'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promptandpause.com'

export const metadata: Metadata = {
  title: 'Prompt & Pause | Pause. Reflect. Grow.',
  description:
    'Five quiet minutes a day to make sense of your life. One thoughtful prompt at a time—private, calm, and without pressure or performance.',
  alternates: { canonical: siteUrl + '/' },
  openGraph: {
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630, alt: 'Prompt & Pause social preview' }],
  },
}

export default async function RootPage() {
  const user = await getAuthUser()

  // Authenticated users go directly to dashboard — no flash of homepage
  if (user) {
    redirect('/dashboard')
  }

  const org = JSON.stringify(organizationJsonLd())
  const site = JSON.stringify(websiteJsonLd())
  const product = JSON.stringify(premiumProductJsonLd())

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: org }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: site }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: product }} />
      <Homepage />
      <AuthHomeRedirect />
    </>
  )
}
