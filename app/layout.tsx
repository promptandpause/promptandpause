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
    'Transform your mental wellness with AI-powered daily reflection prompts. Track mood, reduce stress, and build mindfulness habits. Free trial available. Join thousands finding clarity through guided introspection.',
  keywords: [
    'mental wellness app',
    'daily reflection prompts',
    'mindfulness journaling',
    'mood tracking app',
    'stress relief',
    'mental health tools',
    'guided meditation',
    'self-care app',
    'emotional wellness',
    'anxiety relief',
    'personal growth',
    'mental clarity',
    'wellbeing tracker',
    'reflection journal',
    'mindfulness practice',
    'AI wellness coach',
    'daily prompts',
    'mental health support',
    'self-reflection',
    'emotional intelligence',
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
    title: 'Prompt & Pause - AI-Powered Mental Wellness & Daily Reflection',
    description:
      'Transform your mental wellness with AI-powered daily reflection prompts. Track mood, reduce stress, and build mindfulness habits. Free trial available.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Prompt & Pause - Mental Wellness Through Daily Reflection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt & Pause - AI-Powered Mental Wellness & Daily Reflection',
    description:
      'Transform your mental wellness with AI-powered daily reflection prompts. Track mood, reduce stress, and build mindfulness habits. Free trial available.',
    images: ['/opengraph-image.png'],
    site: '@promptandpause',
    creator: '@promptandpause',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon.png', type: 'image/png', sizes: '64x64' },
    ],
    apple: [{ url: '/PandP_APPiconApple.svg', type: 'image/svg+xml', sizes: '1024x1024' }],
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
