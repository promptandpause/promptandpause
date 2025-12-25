import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://promptandpause.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString()

  const urls: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${siteUrl}/features`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/pricing`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/research`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/our-mission`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/support-us`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/privacy-policy`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${siteUrl}/terms-of-service`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${siteUrl}/cookie-policy`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${siteUrl}/crisis-resources`, changeFrequency: 'monthly', priority: 0.6 },
  ]

  return urls
}
