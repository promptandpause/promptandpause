import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover',
})

interface StripePrice {
  id: string
  amount: number // in cents
  currency: string
  interval: 'month' | 'year'
  product: string
}

interface PricingData {
  monthly: {
    priceId: string
    amount: number // in base currency units (e.g., 12.00 for £12)
    currency: string
    formattedPrice: string // e.g., "£12.00"
  }
  yearly: {
    priceId: string
    amount: number
    currency: string
    formattedPrice: string
    monthlyEquivalent: number // yearly price divided by 12
  }
}

/**
 * Fetch actual pricing from Stripe based on environment variables
 * This ensures pricing is always accurate and matches Stripe's source of truth
 */
export async function getStripePricing(): Promise<PricingData> {
  const monthlyPriceId = process.env.STRIPE_PRICE_MONTHLY!
  const yearlyPriceId = process.env.STRIPE_PRICE_ANNUAL!

  if (!monthlyPriceId || !yearlyPriceId) {
    throw new Error('Missing STRIPE_PRICE_MONTHLY or STRIPE_PRICE_ANNUAL environment variables')
  }

  try {
    // Fetch both prices from Stripe
    const [monthlyPrice, yearlyPrice] = await Promise.all([
      stripe.prices.retrieve(monthlyPriceId),
      stripe.prices.retrieve(yearlyPriceId),
    ])

    // Convert cents to base units
    const monthlyAmount = (monthlyPrice.unit_amount || 0) / 100
    const yearlyAmount = (yearlyPrice.unit_amount || 0) / 100

    return {
      monthly: {
        priceId: monthlyPriceId,
        amount: monthlyAmount,
        currency: monthlyPrice.currency.toUpperCase(),
        formattedPrice: formatPrice(monthlyAmount, monthlyPrice.currency),
      },
      yearly: {
        priceId: yearlyPriceId,
        amount: yearlyAmount,
        currency: yearlyPrice.currency.toUpperCase(),
        formattedPrice: formatPrice(yearlyAmount, yearlyPrice.currency),
        monthlyEquivalent: yearlyAmount / 12,
      },
    }
  } catch (error) {
    throw new Error('Failed to fetch pricing from Stripe')
  }
}

/**
 * Format price with currency symbol
 */
function formatPrice(amount: number, currency: string): string {
  const currencySymbols: Record<string, string> = {
    gbp: '£',
    usd: '$',
    eur: '€',
  }

  const symbol = currencySymbols[currency.toLowerCase()] || currency.toUpperCase()
  return `${symbol}${amount.toFixed(2)}`
}

/**
 * Cache pricing data to avoid excessive Stripe API calls
 * Prices rarely change, so we can cache for 1 hour
 */
let cachedPricing: PricingData | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

export async function getCachedStripePricing(): Promise<PricingData> {
  const now = Date.now()

  // Return cached data if still valid
  if (cachedPricing && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedPricing
  }

  // Fetch fresh data
  cachedPricing = await getStripePricing()
  cacheTimestamp = now

  return cachedPricing
}
