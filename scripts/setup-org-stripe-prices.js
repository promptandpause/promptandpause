/**
 * One-time setup script: creates the Stripe Product and two Prices for
 * organization (workspace) seat billing, then prints the env vars to add.
 *
 * Pricing rationale (see docs/architecture/WORKSPACE_B2B_ARCHITECTURE.md):
 *   - £7.50/seat/month matches the "Starting at £75/month for 10 users"
 *     already published on the pricing page (app/(homepage)/pricing/page.tsx)
 *   - £72/seat/year (= £6/mo) is a 20% annual discount, the same structure
 *     already used by the individual plan (£12/mo -> £99/year)
 *
 * Usage (same command on every OS -- reads STRIPE_SECRET_KEY from .env.local
 * or .env automatically if it isn't already set in your shell):
 *   node scripts/setup-org-stripe-prices.js
 *
 * Safe to re-run -- uses lookup_key so it won't create duplicates if a price
 * with the same key already exists.
 */

const Stripe = require('stripe')
const fs = require('fs')
const path = require('path')

// Load STRIPE_SECRET_KEY from .env.local / .env if it isn't already set in
// the environment. Avoids relying on shell-specific syntax for setting env
// vars inline (the `KEY=value command` prefix only works in bash/zsh, not
// PowerShell or cmd.exe).
function loadKeyFromDotenv() {
  for (const filename of ['.env.local', '.env']) {
    const filePath = path.join(process.cwd(), filename)
    if (!fs.existsSync(filePath)) continue

    const contents = fs.readFileSync(filePath, 'utf8')
    for (const line of contents.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue

      const key = trimmed.slice(0, eqIndex).trim()
      if (key !== 'STRIPE_SECRET_KEY') continue

      let value = trimmed.slice(eqIndex + 1).trim()
      // Strip surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      return value
    }
  }
  return undefined
}

const SECRET_KEY = process.env.STRIPE_SECRET_KEY || loadKeyFromDotenv()
if (!SECRET_KEY) {
  console.error('Could not find STRIPE_SECRET_KEY.')
  console.error('Make sure it is set in .env.local (in the project root) as:')
  console.error('  STRIPE_SECRET_KEY=sk_test_...')
  console.error('Then just run: node scripts/setup-org-stripe-prices.js')
  process.exit(1)
}

if (!SECRET_KEY.startsWith('sk_')) {
  console.error('That doesn\'t look like a Stripe secret key (should start with "sk_"). Double-check .env.local.')
  process.exit(1)
}

console.log(`Using ${SECRET_KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST'} mode key.`)

const stripe = new Stripe(SECRET_KEY, { apiVersion: '2025-10-29.clover' })

const MONTHLY_SEAT_PRICE_GBP = 750 // £7.50, in pence
const ANNUAL_SEAT_PRICE_GBP = 7200 // £72.00, in pence

async function main() {
  console.log('Creating/finding "Prompt & Pause for Teams" product...')

  const products = await stripe.products.list({ limit: 100 })
  let product = products.data.find((p) => p.name === 'Prompt & Pause for Teams')

  if (!product) {
    product = await stripe.products.create({
      name: 'Prompt & Pause for Teams',
      description: 'Per-seat workspace billing for organizations using Prompt & Pause.',
    })
    console.log(`Created product: ${product.id}`)
  } else {
    console.log(`Found existing product: ${product.id}`)
  }

  const existingPrices = await stripe.prices.list({ product: product.id, limit: 100 })

  let monthlyPrice = existingPrices.data.find(
    (p) => p.recurring?.interval === 'month' && p.unit_amount === MONTHLY_SEAT_PRICE_GBP && p.currency === 'gbp'
  )
  if (!monthlyPrice) {
    monthlyPrice = await stripe.prices.create({
      product: product.id,
      currency: 'gbp',
      unit_amount: MONTHLY_SEAT_PRICE_GBP,
      recurring: { interval: 'month' },
      nickname: 'Org seat - monthly',
      lookup_key: 'org_seat_monthly_gbp',
    })
    console.log(`Created monthly price: ${monthlyPrice.id} (£${MONTHLY_SEAT_PRICE_GBP / 100}/seat/mo)`)
  } else {
    console.log(`Found existing monthly price: ${monthlyPrice.id}`)
  }

  let annualPrice = existingPrices.data.find(
    (p) => p.recurring?.interval === 'year' && p.unit_amount === ANNUAL_SEAT_PRICE_GBP && p.currency === 'gbp'
  )
  if (!annualPrice) {
    annualPrice = await stripe.prices.create({
      product: product.id,
      currency: 'gbp',
      unit_amount: ANNUAL_SEAT_PRICE_GBP,
      recurring: { interval: 'year' },
      nickname: 'Org seat - annual',
      lookup_key: 'org_seat_annual_gbp',
    })
    console.log(`Created annual price: ${annualPrice.id} (£${ANNUAL_SEAT_PRICE_GBP / 100}/seat/yr)`)
  } else {
    console.log(`Found existing annual price: ${annualPrice.id}`)
  }

  console.log('\nDone. Add these to your .env / .env.local:\n')
  console.log(`STRIPE_ORG_SEAT_PRICE_MONTHLY=${monthlyPrice.id}`)
  console.log(`STRIPE_ORG_SEAT_PRICE_ANNUAL=${annualPrice.id}`)
  console.log('\nRemember: if SECRET_KEY was a test key, repeat this with your live key before going live.')
}

main().catch((err) => {
  console.error('Setup failed:', err.message)
  process.exit(1)
})
