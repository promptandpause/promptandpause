#!/usr/bin/env node
/**
 * Meta (Facebook) Ads API — pull real performance stats for the brand's ad
 * account. Doubles as a way to accumulate legitimate Marketing API calls
 * toward the 500-call / <15% error-rate access-tier requirement.
 *
 * Requires:
 *   - META_ADS_TOKEN (system-user token with ads_read / ads_management)
 *   - config: scripts/meta-ad-config.json -> adAccountId
 *
 * Usage:
 *   node scripts/meta-stats.js                 # one snapshot
 *   node scripts/meta-stats.js --count 20 --interval 60   # poll 20x, 60s apart
 *
 * Every request is a real, useful read (account, campaigns, adsets, ads,
 * insights). Keeps its own success/error tally so you can watch your tier
 * progress and keep the error rate well under 15%.
 */

const fs = require('fs')
const path = require('path')

const GRAPH = 'https://graph.facebook.com/v23.0'
const TOKEN = process.env.META_ADS_TOKEN
const cfgPath = path.join(__dirname, 'meta-ad-config.json')
const cfg = require(cfgPath)

if (!TOKEN) {
  console.error('Missing META_ADS_TOKEN env var.')
  process.exit(1)
}
if (!fs.existsSync(cfgPath)) {
  console.error(`Config not found: ${cfgPath}`)
  process.exit(1)
}

const args = process.argv.slice(2)
const countIdx = args.indexOf('--count')
const intervalIdx = args.indexOf('--interval')
const COUNT = countIdx > -1 ? Math.max(1, parseInt(args[countIdx + 1], 10)) : 1
const INTERVAL_MS = (intervalIdx > -1 ? parseInt(args[intervalIdx + 1], 10) : 60) * 1000

let totalCalls = 0
let totalErrors = 0

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

async function api(pathname) {
  totalCalls++
  const res = await fetch(`${GRAPH}${pathname}${pathname.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(TOKEN)}`)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    totalErrors++
    log(`API error (${res.status}): ${json?.error?.message || ''}`)
    throw new Error(`${res.status} ${json?.error?.message || ''}`)
  }
  return json
}

function money(minor, currency) {
  if (minor == null) return '-'
  const symbol = currency === 'GBP' ? '£' : `${currency} `
  return `${symbol}${(minor / 100).toFixed(2)}`
}

function pct(a, b) {
  return b ? ((a / b) * 100).toFixed(1) : '0.0'
}

async function snapshot() {
  const adAccount = cfg.adAccountId.startsWith('act_') ? cfg.adAccountId : `act_${cfg.adAccountId}`
  const currency = (await api(`/${adAccount}?fields=name,account_status,currency`).catch(() => ({})))?.currency || 'GBP'

  log('--- account ---')
  try {
    const acct = await api(`/${adAccount}?fields=name,account_status,currency,amount_spent`)
    log(`${acct.name} | status ${acct.account_status} | spent ${money(acct.amount_spent, currency)}`)
  } catch { /* accounted in error tally */ }

  log('--- campaigns ---')
  try {
    const { data = [] } = await api(`/${adAccount}/campaigns?fields=name,status,objective,daily_budget,lifetime_budget&limit=100`)
    if (!data.length) log('(none yet)')
    for (const c of data) {
      log(`${c.name} | ${c.status} | ${c.objective} | daily ${money(c.daily_budget, currency)}`)
    }
  } catch { /* accounted in error tally */ }

  log('--- ad sets ---')
  try {
    const { data = [] } = await api(`/${adAccount}/adsets?fields=name,status,optimization_goal,billing_event&limit=100`)
    if (!data.length) log('(none yet)')
    for (const a of data) {
      log(`${a.name} | ${a.status} | ${a.optimization_goal} | ${a.billing_event}`)
    }
  } catch { /* accounted in error tally */ }

  log('--- ads ---')
  try {
    const { data = [] } = await api(`/${adAccount}/ads?fields=name,status,adset_id&limit=100`)
    if (!data.length) log('(none yet)')
    for (const a of data) {
      log(`${a.name} | ${a.status} | adset ${a.adset_id}`)
    }
  } catch { /* accounted in error tally */ }

  log('--- insights (last 7 days) ---')
  try {
    const { data = [] } = await api(`/${adAccount}/insights?fields=campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach&date_preset=last_7d&limit=100`)
    if (!data.length) log('(no data yet — expected until ads run)')
    for (const i of data) {
      log(`${i.campaign_name} | spend ${money(i.spend, currency)} | impressions ${i.impressions} | clicks ${i.clicks} | CTR ${i.ctr}% | CPC ${money(i.cpc, currency)} | reach ${i.reach}`)
    }
  } catch { /* accounted in error tally */ }

  const rate = pct(totalErrors, totalCalls)
  log(`Calls so far: ${totalCalls} | errors ${totalErrors} (${rate}%)`)
}

async function main() {
  if (COUNT > 1 && intervalIdx === -1) {
    log('Note: polling with default 60s interval. Use --interval <seconds> to change it.')
  }
  for (let i = 0; i < COUNT; i++) {
    await snapshot()
    if (i < COUNT - 1) await new Promise((r) => setTimeout(r, INTERVAL_MS))
  }
  const rate = totalErrors / totalCalls
  log(`\nSUMMARY: ${totalCalls} calls, ${totalErrors} errors, error rate ${(rate * 100).toFixed(1)}%`)
  if (totalCalls >= 500 && rate < 0.15) {
    log('Access-tier requirement MET (500+ calls, <15% errors).')
  } else {
    log(`Access-tier requirement: ${Math.max(0, 500 - totalCalls)} more calls needed (keep errors <15%).`)
  }
  process.exit(rate >= 0.15 ? 1 : 0)
}

main().catch((err) => {
  log(`FATAL: ${err.message}`)
  process.exit(1)
})
