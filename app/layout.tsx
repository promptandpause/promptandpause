import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { GlobalSyncProvider } from '@/lib/context/GlobalSyncContext'
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
    'Five quiet minutes a day to make sense of your life. One thoughtful prompt at a time—private, calm, and without pressure or performance.',
  keywords: [
    'daily reflection prompts',
    'reflection journal',
    'journaling prompts',
    'private journaling',
    'guided journaling',
    'mindful journaling',
    'self reflection',
    'reflection practice',
    'thoughtful prompts',
    'quiet journaling',
    'personal journaling',
    'writing prompts',
    'daily writing habit',
    'calm routine',
    'mindfulness practice',
    'mental clarity',
    'personal growth',
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
    title: 'Prompt & Pause | Quiet daily reflection',
    description:
      'Five quiet minutes a day to make sense of your life. One thoughtful prompt at a time—private, calm, and without pressure or performance.',
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
    title: 'Prompt & Pause | Quiet daily reflection',
    description:
      'Five quiet minutes a day to make sense of your life. One thoughtful prompt at a time—private, calm, and without pressure or performance.',
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
  themeColor: '#0f172a',
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
        <Analytics />
      </body>
    </html>
  )
}
