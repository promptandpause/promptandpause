export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Prompt & Pause",
    alternateName: "Prompt and Pause",
    url: "https://promptandpause.com",
    logo: "https://promptandpause.com/icon.png",
    description: "A calm reflection practice with one thoughtful prompt at a time—private, quiet, and without pressure or performance.",
    foundingDate: "2024",
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@promptandpause.com",
      contactType: "Customer Support",
      availableLanguage: ["English"]
    },
    sameAs: [
      "https://twitter.com/promptandpause",
      "https://linkedin.com/company/promptandpause",
      "https://instagram.com/promptandpause"
    ]
  }
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Prompt & Pause",
    alternateName: "Prompt and Pause",
    url: "https://promptandpause.com",
    description: "Five quiet minutes a day to make sense of your life. One thoughtful prompt at a time—private, calm, and without pressure or performance.",
    inLanguage: "en-GB",
    publisher: {
      "@type": "Organization",
      name: "Prompt & Pause",
      logo: {
        "@type": "ImageObject",
        url: "https://promptandpause.com/icon.png"
      }
    },
    potentialAction: {
      "@type": "SearchAction",
      target: "https://promptandpause.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }
}

export function premiumProductJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Prompt & Pause Premium",
    applicationCategory: "HealthApplication",
    operatingSystem: "Web, iOS, Android",
    description: "Premium subscription with weekly and monthly reflection summaries, gentle perspective over time, and export/retrieval features.",
    brand: { 
      "@type": "Brand", 
      name: "Prompt & Pause" 
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
      bestRating: "5"
    },
    offers: [
      {
        "@type": "Offer",
        name: "Monthly Premium",
        priceCurrency: "GBP",
        price: "12",
        priceValidUntil: "2026-12-31",
        availability: "https://schema.org/InStock",
        url: "https://promptandpause.com/pricing"
      },
      {
        "@type": "Offer",
        name: "Annual Premium",
        priceCurrency: "GBP",
        price: "120",
        priceValidUntil: "2026-12-31",
        availability: "https://schema.org/InStock",
        url: "https://promptandpause.com/pricing"
      }
    ]
  }
}

