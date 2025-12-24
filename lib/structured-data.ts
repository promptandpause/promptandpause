export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Prompt & Pause",
    url: "https://promptandpause.com",
    logo: "https://promptandpause.com/icon.png",
    sameAs: [
      "https://twitter.com/promptandpause"
    ]
  }
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Prompt & Pause",
    url: "https://promptandpause.com",
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
    "@type": "Product",
    name: "Prompt & Pause Premium",
    description: "Daily prompts, mood insights, and priority delivery.",
    brand: { "@type": "Brand", name: "Prompt & Pause" },
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: "12",
      availability: "https://schema.org/InStock",
      url: "https://promptandpause.com/homepage/pricing"
    }
  }
}
