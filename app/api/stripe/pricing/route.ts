import { NextRequest, NextResponse } from 'next/server'
import { getCachedStripePricing } from '@/lib/stripe/pricing'

/**
 * GET /api/stripe/pricing
 * Returns actual prices from Stripe based on environment variables
 * 
 * This ensures admin panel and all pages show correct, current pricing
 */
export async function GET(request: NextRequest) {
  try {
    const pricing = await getCachedStripePricing()

    return NextResponse.json({
      success: true,
      data: pricing,
    })
  } catch (error: any) {
    console.error('Error fetching Stripe pricing:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch pricing',
      },
      { status: 500 }
    )
  }
}
