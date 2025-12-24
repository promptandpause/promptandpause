import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promptandpause.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  const urls: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${siteUrl}/homepage/features`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/homepage/pricing`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/homepage/research`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/homepage/our-mission`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/homepage/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/homepage/support-us`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/homepage/privacy-policy`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${siteUrl}/homepage/terms-of-service`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${siteUrl}/homepage/cookie-policy`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${siteUrl}/crisis-resources`, changeFrequency: 'monthly', priority: 0.6 },
  ]

  return urls
}
