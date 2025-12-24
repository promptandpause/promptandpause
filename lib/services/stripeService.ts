import Stripe from 'stripe'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * Stripe Service for Prompt & Pause
 * 
 * Handles payment processing and subscription management using Stripe API.
 * Includes checkout sessions, customer portal, and subscription operations.
 * 
 * Environment Variables Required:
 * - STRIPE_SECRET_KEY: Stripe secret API key
 * - STRIPE_PRICE_MONTHLY: Price ID for monthly plan
 * - STRIPE_PRICE_ANNUAL: Price ID for annual plan
 * - NEXT_PUBLIC_APP_URL: Base URL for redirect URLs
 */

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

// Price IDs from environment
export const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY || '',
  annual: process.env.STRIPE_PRICE_ANNUAL || '',
}

// App URL for redirects
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://promptandpause.com'

// =============================================================================
// CHECKOUT & SUBSCRIPTION CREATION
// =============================================================================

/**
 * Create a Stripe checkout session for subscription purchase
 * 
 * @param userId - User ID from Supabase auth
 * @param email - Customer email address
 * @param priceId - Stripe price ID (monthly or annual)
 * @param successUrl - URL to redirect on successful checkout (optional)
 * @param cancelUrl - URL to redirect on cancelled checkout (optional)
 * @returns Promise with checkout session or error
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  priceId: string,
  successUrl?: string,
  cancelUrl?: string
): Promise<{ sessionId?: string; url?: string; error?: string }> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('stripe_config_missing', { key: 'STRIPE_SECRET_KEY' })
      return { error: 'Payment service not configured' }
    }

    // Validate price ID
    if (!priceId || (priceId !== PRICE_IDS.monthly && priceId !== PRICE_IDS.annual)) {
      logger.warn('stripe_invalid_price_id', { priceId })
      return { error: 'Invalid subscription plan' }
    }

    // Check if user already has a Stripe customer ID
    const supabase = createServiceRoleClient()
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

    let customerId = user?.stripe_customer_id

    // Create new customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: {
          supabase_user_id: userId,
        },
      })
      customerId = customer.id

      // Update user with customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)

      logger.info('stripe_customer_created', { stripe_customer_id: customerId, userId })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${APP_URL}/dashboard?subscription=success`,
      cancel_url: cancelUrl || `${APP_URL}/dashboard/settings?subscription=cancelled`,
      metadata: {
        supabase_user_id: userId,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
        },
      },
    })
    return {
      sessionId: session.id,
      url: session.url || undefined,
    }
  } catch (error) {
    logger.error('stripe_create_checkout_error', { error })
    return {
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
    }
  }
}

/**
 * Create a Stripe customer portal session for subscription management
 * 
 * @param customerId - Stripe customer ID
 * @param returnUrl - URL to return to after portal session (optional)
 * @returns Promise with portal session URL or error
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl?: string
): Promise<{ url?: string; error?: string }> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('stripe_config_missing', { key: 'STRIPE_SECRET_KEY' })
      return { error: 'Payment service not configured' }
    }

    if (!customerId) {
      return { error: 'Customer ID is required' }
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${APP_URL}/dashboard/settings`,
    })
    return { url: session.url }
  } catch (error) {
    logger.error('stripe_create_portal_error', { error })
    return {
      error: error instanceof Error ? error.message : 'Failed to create portal session',
    }
  }
}

// =============================================================================
// SUBSCRIPTION RETRIEVAL & MANAGEMENT
// =============================================================================

/**
 * Get subscription status and details from Stripe
 * 
 * @param subscriptionId - Stripe subscription ID
 * @returns Promise with subscription details or error
 */
export async function getSubscriptionStatus(
  subscriptionId: string
): Promise<{
  subscription?: Stripe.Subscription
  error?: string
}> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('stripe_config_missing', { key: 'STRIPE_SECRET_KEY' })
      return { error: 'Payment service not configured' }
    }

    if (!subscriptionId) {
      return { error: 'Subscription ID is required' }
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    return { subscription }
  } catch (error) {
    logger.error('stripe_retrieve_subscription_error', { error, subscriptionId })
    return {
      error: error instanceof Error ? error.message : 'Failed to retrieve subscription',
    }
  }
}

/**
 * Get customer details from Stripe
 * 
 * @param customerId - Stripe customer ID
 * @returns Promise with customer details or error
 */
export async function getCustomer(
  customerId: string
): Promise<{
  customer?: Stripe.Customer
  error?: string
}> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('stripe_config_missing', { key: 'STRIPE_SECRET_KEY' })
      return { error: 'Payment service not configured' }
    }

    if (!customerId) {
      return { error: 'Customer ID is required' }
    }

    const customer = await stripe.customers.retrieve(customerId)

    if (customer.deleted) {
      return { error: 'Customer has been deleted' }
    }

    return { customer: customer as Stripe.Customer }
  } catch (error) {
    logger.error('stripe_retrieve_customer_error', { error, customerId })
    return {
      error: error instanceof Error ? error.message : 'Failed to retrieve customer',
    }
  }
}

/**
 * Cancel a subscription
 * 
 * @param subscriptionId - Stripe subscription ID
 * @param immediately - If true, cancel immediately; if false, cancel at period end
 * @returns Promise with cancelled subscription or error
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<{
  subscription?: Stripe.Subscription
  error?: string
}> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('stripe_config_missing', { key: 'STRIPE_SECRET_KEY' })
      return { error: 'Payment service not configured' }
    }

    if (!subscriptionId) {
      return { error: 'Subscription ID is required' }
    }

    let subscription: Stripe.Subscription

    if (immediately) {
      // Cancel immediately
      subscription = await stripe.subscriptions.cancel(subscriptionId)
    } else {
      // Cancel at period end
      subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
    }

    return { subscription }
  } catch (error) {
    logger.error('stripe_cancel_subscription_error', { error, subscriptionId, immediately })
    return {
      error: error instanceof Error ? error.message : 'Failed to cancel subscription',
    }
  }
}

/**
 * Update subscription to a new price/plan
 * 
 * @param subscriptionId - Stripe subscription ID
 * @param newPriceId - New price ID to switch to
 * @returns Promise with updated subscription or error
 */
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<{
  subscription?: Stripe.Subscription
  error?: string
}> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('stripe_config_missing', { key: 'STRIPE_SECRET_KEY' })
      return { error: 'Payment service not configured' }
    }

    if (!subscriptionId || !newPriceId) {
      return { error: 'Subscription ID and price ID are required' }
    }

    // Retrieve current subscription
    const currentSubscription = await stripe.subscriptions.retrieve(subscriptionId)

    if (!currentSubscription.items.data[0]) {
      return { error: 'Subscription has no items' }
    }

    // Update subscription with new price
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: currentSubscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations', // Charge/credit prorated amount
    })
    return { subscription }
  } catch (error) {
    logger.error('stripe_update_subscription_error', { error, subscriptionId, newPriceId })
    return {
      error: error instanceof Error ? error.message : 'Failed to update subscription',
    }
  }
}

/**
 * Reactivate a cancelled subscription (if still within period)
 * 
 * @param subscriptionId - Stripe subscription ID
 * @returns Promise with reactivated subscription or error
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<{
  subscription?: Stripe.Subscription
  error?: string
}> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('stripe_config_missing', { key: 'STRIPE_SECRET_KEY' })
      return { error: 'Payment service not configured' }
    }

    if (!subscriptionId) {
      return { error: 'Subscription ID is required' }
    }

    // Remove the cancellation flag
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })
    return { subscription }
  } catch (error) {
    logger.error('stripe_reactivate_subscription_error', { error, subscriptionId })
    return {
      error: error instanceof Error ? error.message : 'Failed to reactivate subscription',
    }
  }
}

// =============================================================================
// DATABASE SYNC HELPERS
// =============================================================================

/**
 * Update user's subscription info in Supabase after Stripe events
 * This should be called from webhook handlers
 * 
 * @param userId - Supabase user ID
 * @param subscriptionData - Subscription data from Stripe
 */
export async function syncSubscriptionToDatabase(
  userId: string,
  subscriptionData: {
    stripe_subscription_id: string
    stripe_customer_id: string
    status: string
    plan_type: 'monthly' | 'annual'
    current_period_start: string
    current_period_end: string
    cancel_at_period_end: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    // Determine subscription tier based on status
    const subscriptionTier = subscriptionData.status === 'active' ? 'premium' : 'freemium'
    const subscriptionStatus = subscriptionData.status === 'active' ? 'active' : 
                                subscriptionData.status === 'canceled' ? 'cancelled' : 
                                'expired'

    // Update users table
    const { error: userError } = await supabase
      .from('users')
      .update({
        stripe_customer_id: subscriptionData.stripe_customer_id,
        stripe_subscription_id: subscriptionData.stripe_subscription_id,
        subscription_tier: subscriptionTier,
        subscription_status: subscriptionStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (userError) {
      return { success: false, error: userError.message }
    }

    // Upsert to subscriptions table
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          stripe_subscription_id: subscriptionData.stripe_subscription_id,
          stripe_customer_id: subscriptionData.stripe_customer_id,
          status: subscriptionData.status,
          plan_type: subscriptionData.plan_type,
          current_period_start: subscriptionData.current_period_start,
          current_period_end: subscriptionData.current_period_end,
          cancel_at_period_end: subscriptionData.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'stripe_subscription_id',
        }
      )

    if (subError) {
      return { success: false, error: subError.message }
    }
    return { success: true }
  } catch (error) {
    logger.error('stripe_sync_subscription_db_error', { error, userId })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Handle subscription cancellation in database
 * 
 * @param userId - Supabase user ID
 * @param subscriptionId - Stripe subscription ID
 */
export async function handleSubscriptionCancellation(
  userId: string,
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServiceRoleClient()

    // Update users table
    const { error: userError } = await supabase
      .from('users')
      .update({
        subscription_tier: 'freemium',
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (userError) {
      return { success: false, error: userError.message }
    }

    // Update subscriptions table
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (subError) {
      return { success: false, error: subError.message }
    }
    return { success: true }
  } catch (error) {
    logger.error('stripe_handle_cancellation_db_error', { error, userId, subscriptionId })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get friendly plan name from price ID
 * 
 * @param priceId - Stripe price ID
 * @returns Human-readable plan name
 */
export function getPlanName(priceId: string): string {
  if (priceId === PRICE_IDS.monthly) {
    return 'Monthly Premium'
  }
  if (priceId === PRICE_IDS.annual) {
    return 'Annual Premium'
  }
  return 'Unknown Plan'
}

/**
 * Get price amount from price ID (requires API call)
 * 
 * @param priceId - Stripe price ID
 * @returns Promise with price amount or error
 */
export async function getPriceAmount(
  priceId: string
): Promise<{ amount?: number; currency?: string; error?: string }> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { error: 'Payment service not configured' }
    }

    const price = await stripe.prices.retrieve(priceId)

    return {
      amount: price.unit_amount || undefined,
      currency: price.currency,
    }
  } catch (error) {
    logger.error('stripe_retrieve_price_error', { error, priceId })
    return {
      error: error instanceof Error ? error.message : 'Failed to retrieve price',
    }
  }
}

/**
 * Validate Stripe service configuration
 * 
 * @returns Object with configuration status
 */
export function validateStripeConfig(): {
  configured: boolean
  hasSecretKey: boolean
  hasPriceIds: boolean
  prices: {
    monthly: string | null
    annual: string | null
  }
} {
  return {
    configured: !!(
      process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_MONTHLY &&
      process.env.STRIPE_PRICE_ANNUAL
    ),
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    hasPriceIds: !!(process.env.STRIPE_PRICE_MONTHLY && process.env.STRIPE_PRICE_ANNUAL),
    prices: {
      monthly: process.env.STRIPE_PRICE_MONTHLY || null,
      annual: process.env.STRIPE_PRICE_ANNUAL || null,
    },
  }
}

/**
 * Check if subscription is active and not expired
 * 
 * @param subscription - Stripe subscription object
 * @returns Boolean indicating if subscription is currently active
 */
export function isSubscriptionActive(subscription: Stripe.Subscription): boolean {
  return (
    subscription.status === 'active' ||
    subscription.status === 'trialing'
  )
}

/**
 * Check if subscription will renew or is set to cancel
 * 
 * @param subscription - Stripe subscription object
 * @returns Boolean indicating if subscription will auto-renew
 */
export function willSubscriptionRenew(subscription: Stripe.Subscription): boolean {
  return !subscription.cancel_at_period_end && isSubscriptionActive(subscription)
}
