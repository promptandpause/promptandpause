import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from '@/components/ui/sonner'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { GlobalSyncProvider } from '@/lib/context/GlobalSyncContext'
import { PWARegistration } from '@/components/PWARegistration'
import MetaPixel from '@/components/MetaPixel'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promptandpause.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'Prompt & Pause',
  title: {
    default: 'Prompt & Pause | Pause. Reflect. Grow.',
    template: 'Prompt & Pause | %s',
  },
  description:
    'AI-powered daily reflection prompts personalized to your goals, mood, and focus areas. Write privately or share with a supportive community. Free to start.',
  keywords: [
    'daily reflection prompts',
    'AI journaling',
    'personalized journal prompts',
    'mental wellness app',
    'daily reflection habit',
    'mood tracking',
    'guided journaling',
    'self reflection',
    'personal growth',
    'mindfulness practice',
    'reflection community',
    'writing prompts',
    'daily writing habit',
    'gratitude journal',
    'mental health app',
  ],
  authors: [{ name: 'Prompt & Pause' }],
  creator: 'Prompt & Pause',
  publisher: 'Prompt & Pause',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    alternateLocale: ['en_US'],
    siteName: 'Prompt & Pause',
    url: siteUrl,
    title: 'Prompt & Pause | Daily reflection for growth',
    description:
      'AI-powered daily reflection prompts personalized to your goals, mood, and focus areas. Write privately or share with a supportive community.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Prompt & Pause social preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt & Pause | Daily reflection for growth',
    description:
      'AI-powered daily reflection prompts personalized to your goals, mood, and focus areas. Write privately or share with a supportive community.',
    images: ['/opengraph-image.png'],
    site: '@promptandpause',
    creator: '@promptandpause',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon.png', type: 'image/png', sizes: '64x64' },
    ],
    apple: [
      { url: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: [{ url: '/favicon.ico' }],
  },
  manifest: '/manifest.json',
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1D9BF0',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider>
          <LanguageProvider>
            <GlobalSyncProvider>
              {/* Use homepage/page.tsx as the landing route */}
              {children}
              <Toaster />
            </GlobalSyncProvider>
          </LanguageProvider>
        </ThemeProvider>
        <PWARegistration />
        <Analytics />
        <SpeedInsights />
        <MetaPixel />
      </body>
    </html>
  )
}
