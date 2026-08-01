#!/usr/bin/env node
/**
 * Meta (Facebook) Ads API — create campaign + ad set + creative + ad.
 *
 * Requires:
 *   - META_ADS_TOKEN env var (system-user token with ads_management + ads_read,
 *     generated in Business Settings > Users > System users; ad account and
 *     page must be assigned to that system user)
 *   - An ad account with a payment method (config.adAccountId)
 *   - A 1080x1080 (or 1080x1350) creative image (config.imagePath)
 *
 * Usage:
 *   node scripts/create-meta-ad.js                 # creates everything PAUSED
 *   node scripts/create-meta-ad.js --activate      # then flips everything ACTIVE
 *   node scripts/create-meta-ad.js --config custom.json
 *
 * Everything is created PAUSED by default so you can review in Ads Manager
 * before any money is spent.
 */

const fs = require('fs')
const path = require('path')

const GRAPH = 'https://graph.facebook.com/v23.0'
const TOKEN = process.env.META_ADS_TOKEN
const CONFIG_PATH = path.join(__dirname, 'meta-ad-config.json')

const args = process.argv.slice(2)
const ACTIVATE = args.includes('--activate')
const configIdx = args.indexOf('--config')
const cfgPath = configIdx > -1 && args[configIdx + 1] ? path.resolve(args[configIdx + 1]) : CONFIG_PATH

if (!TOKEN) {
  console.error('Missing META_ADS_TOKEN env var.')
  process.exit(1)
}

if (!fs.existsSync(cfgPath)) {
  console.error(`Config not found: ${cfgPath}`)
  process.exit(1)
}

const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
const AD_ACCOUNT = cfg.adAccountId.startsWith('act_') ? cfg.adAccountId : `act_${cfg.adAccountId}`

async function api(pathname, opts = {}) {
  const url = `${GRAPH}${pathname}${pathname.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(TOKEN)}`
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: opts.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    body: opts.body,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(`${res.status} ${json?.error?.message || ''}`)
    err.response = json
    throw err
  }
  return json
}

// Tries alternate field values (objective / optimization_goal naming differs
// across API versions) and uses the first that the API accepts.
async function createWithFallback(pathname, body, variants) {
  let lastErr
  for (const v of variants) {
    try {
      return await api(pathname, { method: 'POST', body: JSON.stringify({ ...body, ...v }) })
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

async function uploadImage() {
  const buf = fs.readFileSync(cfg.imagePath)
  const filename = path.basename(cfg.imagePath)
  const ext = path.extname(filename).toLowerCase()
  const mime = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg'
  const fd = new FormData()
  fd.append('filename', new Blob([buf], { type: mime }), filename)
  const json = await api(`/${AD_ACCOUNT}/adimages`, { method: 'POST', body: fd })
  const hash = json.images?.[filename]?.hash
  if (!hash) throw new Error('Image upload failed: ' + JSON.stringify(json))
  return hash
}

async function main() {
  // 0. Validate ad account + token permissions
  console.log(`\n> Validating ad account ${AD_ACCOUNT}...`)
  try {
    const acct = await api(`/${AD_ACCOUNT}?fields=name,account_status,currency`)
    console.log(`  OK: ${acct.name} (status ${acct.account_status}, currency ${acct.currency})`)
    if (acct.account_status !== 1) {
      console.warn('  NOTE: account_status is not 1 (Active). Check Business Settings before spending.')
    }
  } catch (err) {
    console.error(`  FAILED: ${err.message}`)
    console.error('  Ensure META_ADS_TOKEN has ads_management, and the ad account is assigned to the system user.')
    process.exit(1)
  }

  // 1. Campaign
  console.log('\n> Creating campaign...')
  const campaign = await createWithFallback(`/${AD_ACCOUNT}/campaigns`, {
    name: cfg.campaignName,
    status: 'PAUSED',
    special_ad_categories: [],
    is_adset_budget_sharing_enabled: false,
  }, [
    { objective: cfg.objective },
    ...(cfg.objective === 'OUTCOME_TRAFFIC' ? [{ objective: 'TRAFFIC' }] : []),
  ])
  console.log(`  Campaign ID: ${campaign.id}`)

  // 2. Ad set
  console.log('\n> Creating ad set...')
  const targeting = {
    geo_locations: { countries: cfg.targeting.countries || ['GB'] },
    ...(cfg.targeting.ageMin ? { age_min: cfg.targeting.ageMin } : {}),
    ...(cfg.targeting.ageMax ? { age_max: cfg.targeting.ageMax } : {}),
    ...(cfg.targeting.interests?.length
      ? { interests: cfg.targeting.interests.map((i) => ({ id: i.id, name: i.name })) }
      : {}),
  }
  const adSet = await createWithFallback(`/${AD_ACCOUNT}/adsets`, {
    name: cfg.adSetName,
    campaign_id: campaign.id,
    daily_budget: cfg.dailyBudgetMinor,
    billing_event: 'IMPRESSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    targeting,
    status: 'PAUSED',
  }, [
    { optimization_goal: 'LANDING_PAGE_VIEWS' },
    { optimization_goal: 'LINK_CLICKS' },
  ])
  console.log(`  Ad Set ID: ${adSet.id}`)

  // 3. Creative (upload image first, then build link creative)
  console.log('\n> Uploading creative image...')
  const imageHash = await uploadImage()
  console.log(`  Image hash: ${imageHash.slice(0, 12)}...`)

  console.log('\n> Creating creative...')
  const creative = await api(`/${AD_ACCOUNT}/adcreatives`, {
    method: 'POST',
    body: JSON.stringify({
      name: cfg.adName,
      object_story_spec: {
        page_id: cfg.pageId,
        link_data: {
          link: cfg.landingUrl,
          message: cfg.primaryText,
          name: cfg.headline,
          description: cfg.description,
          image_hash: imageHash,
          call_to_action: { type: cfg.callToAction },
        },
      },
    }),
  })
  console.log(`  Creative ID: ${creative.id}`)

  // 4. Ad
  console.log('\n> Creating ad...')
  const ad = await api(`/${AD_ACCOUNT}/ads`, {
    method: 'POST',
    body: JSON.stringify({
      name: cfg.adName,
      adset_id: adSet.id,
      creative: { creative_id: creative.id },
      status: 'PAUSED',
    }),
  })
  console.log(`  Ad ID: ${ad.id}`)

  console.log(`\n✅ Campaign ${campaign.id} / Ad set ${adSet.id} / Ad ${ad.id} created (all PAUSED).`)

  if (ACTIVATE) {
    console.log('\n> Activating (--activate)...')
    await api(`/${ad.id}`, { method: 'POST', body: JSON.stringify({ status: 'ACTIVE' }) })
    await api(`/${adSet.id}`, { method: 'POST', body: JSON.stringify({ status: 'ACTIVE' }) })
    await api(`/${campaign.id}`, { method: 'POST', body: JSON.stringify({ status: 'ACTIVE' }) })
    console.log('  All ACTIVE. Ad is now spending.')
  } else {
    console.log('\nReview it first: https://www.facebook.com/adsmanager/manage/campaigns')
    console.log('Then activate with:  node scripts/create-meta-ad.js --activate')
  }
}

main().catch((err) => {
  console.error(`\n✗ Failed: ${err.message}`)
  if (err.response) console.error(JSON.stringify(err.response, null, 2))
  process.exit(1)
})
