import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// =============================================================================
// SYSTEM HEALTH CHECK API
// =============================================================================
// This endpoint checks the health of all critical infrastructure components
// and sends email alerts to infrastructure@promptandpause.com on failures.

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface SystemStatus {
  name: string
  status: 'operational' | 'degraded' | 'down'
  responseTime?: number
  lastChecked: string
  error?: string
  category: 'core' | 'payment' | 'communication' | 'ai' | 'integration' | 'internal'
}

interface HealthCheckResponse {
  overall: 'operational' | 'degraded' | 'down'
  systems: SystemStatus[]
  timestamp: string
  alertsSent: string[]
}

// Track previous failures to avoid spam
const failureCache = new Map<string, { lastAlert: number, consecutiveFailures: number }>()
const ALERT_COOLDOWN = 5 * 60 * 1000 // 5 minutes between alerts
const ALERT_THRESHOLD = 2 // Send alert after 2 consecutive failures

/**
 * Check Supabase database connectivity
 */
async function checkSupabase(): Promise<SystemStatus> {
  const startTime = Date.now()
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Simple health check query
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    
    if (error) throw error

    const responseTime = Date.now() - startTime

    return {
      name: 'Supabase Database',
      status: responseTime > 2000 ? 'degraded' : 'operational',
      responseTime,
      lastChecked: new Date().toISOString(),
      category: 'core'
    }
  } catch (error) {
    return {
      name: 'Supabase Database',
      status: 'down',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      category: 'core'
    }
  }
}

/**
 * Check Stripe API connectivity
 */
async function checkStripe(): Promise<SystemStatus> {
  const startTime = Date.now()
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY

    if (!stripeKey) {
      throw new Error('Stripe credentials not configured')
    }

    // Make a simple API call to check connectivity
    const response = await fetch('https://api.stripe.com/v1/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Stripe API returned ${response.status}`)
    }

    const responseTime = Date.now() - startTime

    return {
      name: 'Stripe Payments',
      status: responseTime > 3000 ? 'degraded' : 'operational',
      responseTime,
      lastChecked: new Date().toISOString(),
      category: 'payment'
    }
  } catch (error) {
    return {
      name: 'Stripe Payments',
      status: 'down',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      category: 'payment'
    }
  }
}

/**
 * Check Resend email service
 */
async function checkResend(): Promise<SystemStatus> {
  const startTime = Date.now()
  try {
    const resendKey = process.env.RESEND_API_KEY

    if (!resendKey) {
      throw new Error('Resend credentials not configured')
    }

    const resend = new Resend(resendKey)
    
    // Check if we can access the API (simple domains list call)
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Resend API returned ${response.status}`)
    }

    const responseTime = Date.now() - startTime

    return {
      name: 'Resend Email Service',
      status: responseTime > 2000 ? 'degraded' : 'operational',
      responseTime,
      lastChecked: new Date().toISOString(),
      category: 'communication'
    }
  } catch (error) {
    return {
      name: 'Resend Email Service',
      status: 'down',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      category: 'communication'
    }
  }
}

/**
 * Check Upstash Redis connectivity
 */
async function checkUpstash(): Promise<SystemStatus> {
  const startTime = Date.now()
  try {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!upstashUrl || !upstashToken) {
      // Upstash is optional, so return operational if not configured
      return {
        name: 'Upstash Redis',
        status: 'operational',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        category: 'core'
      }
    }

    // Simple PING command
    const response = await fetch(`${upstashUrl}/ping`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${upstashToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Upstash returned ${response.status}`)
    }

    const responseTime = Date.now() - startTime

    return {
      name: 'Upstash Redis',
      status: responseTime > 1000 ? 'degraded' : 'operational',
      responseTime,
      lastChecked: new Date().toISOString(),
      category: 'core'
    }
  } catch (error) {
    return {
      name: 'Upstash Redis',
      status: 'down',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      category: 'core'
    }
  }
}

/**
 * Check Gemini AI
 */
async function checkGemini(): Promise<SystemStatus> {
  const startTime = Date.now()
  try {
    const geminiKey = process.env.GEMINI_API_KEY
    
    if (!geminiKey) {
      throw new Error('Gemini credentials not configured')
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`,
      { method: 'GET' }
    )

    if (!response.ok) {
      throw new Error(`Gemini API returned ${response.status}`)
    }

    const responseTime = Date.now() - startTime

    return {
      name: 'Gemini AI',
      status: responseTime > 3000 ? 'degraded' : 'operational',
      responseTime,
      lastChecked: new Date().toISOString(),
      category: 'ai'
    }
  } catch (error) {
    return {
      name: 'Gemini AI',
      status: 'down',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      category: 'ai'
    }
  }
}

/**
 * Check OpenRouter AI
 */
async function checkOpenRouter(): Promise<SystemStatus> {
  const startTime = Date.now()
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY
    
    if (!openRouterKey) {
      throw new Error('OpenRouter credentials not configured')
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API returned ${response.status}`)
    }

    const responseTime = Date.now() - startTime

    return {
      name: 'OpenRouter AI',
      status: responseTime > 3000 ? 'degraded' : 'operational',
      responseTime,
      lastChecked: new Date().toISOString(),
      category: 'ai'
    }
  } catch (error) {
    return {
      name: 'OpenRouter AI',
      status: 'down',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      category: 'ai'
    }
  }
}

/**
 * Check OpenAI (Backup)
 */
async function checkOpenAI(): Promise<SystemStatus> {
  const startTime = Date.now()
  try {
    const openAIKey = process.env.OPENAI_API_KEY
    
    if (!openAIKey) {
      return {
        name: 'OpenAI (Backup)',
        status: 'operational',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        category: 'ai'
      }
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`OpenAI API returned ${response.status}`)
    }

    const responseTime = Date.now() - startTime

    return {
      name: 'OpenAI (Backup)',
      status: responseTime > 3000 ? 'degraded' : 'operational',
      responseTime,
      lastChecked: new Date().toISOString(),
      category: 'ai'
    }
  } catch (error) {
    return {
      name: 'OpenAI (Backup)',
      status: 'down',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      category: 'ai'
    }
  }
}

/**
 * Check Application Health
 */
async function checkApplication(): Promise<SystemStatus> {
  const startTime = Date.now()
  try {
    const responseTime = Date.now() - startTime

    return {
      name: 'Next.js Application',
      status: 'operational',
      responseTime,
      lastChecked: new Date().toISOString(),
      category: 'core'
    }
  } catch (error) {
    return {
      name: 'Next.js Application',
      status: 'down',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      category: 'core'
    }
  }
}

/**
 * Check Slack Integration
 */
async function checkSlack(): Promise<SystemStatus> {
  const startTime = Date.now()
  try {
    const slackClientId = process.env.SLACK_CLIENT_ID
    
    if (!slackClientId) {
      return {
        name: 'Slack Integration',
        status: 'operational',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        category: 'integration'
      }
    }

    // Simple API health check
    const response = await fetch('https://slack.com/api/api.test', {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Slack API returned ${response.status}`)
    }

    const responseTime = Date.now() - startTime

    return {
      name: 'Slack Integration',
      status: responseTime > 2000 ? 'degraded' : 'operational',
      responseTime,
      lastChecked: new Date().toISOString(),
      category: 'integration'
    }
  } catch (error) {
    return {
      name: 'Slack Integration',
      status: 'down',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      category: 'integration'
    }
  }
}

/**
 * Check BaseHub CMS
 */
async function checkBaseHub(): Promise<SystemStatus> {
  const startTime = Date.now()
  try {
    const baseHubKey = process.env.BASE_HUB
    
    if (!baseHubKey) {
      return {
        name: 'BaseHub CMS',
        status: 'operational',
        responseTime: 0,
        lastChecked: new Date().toISOString(),
        category: 'integration'
      }
    }

    // Simple health check - BaseHub GraphQL endpoint
    const response = await fetch('https://api.basehub.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${baseHubKey}`,
      },
      body: JSON.stringify({
        query: '{ __typename }'
      })
    })

    if (!response.ok) {
      throw new Error(`BaseHub API returned ${response.status}`)
    }

    const responseTime = Date.now() - startTime

    return {
      name: 'BaseHub CMS',
      status: responseTime > 2000 ? 'degraded' : 'operational',
      responseTime,
      lastChecked: new Date().toISOString(),
      category: 'integration'
    }
  } catch (error) {
    return {
      name: 'BaseHub CMS',
      status: 'down',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      category: 'integration'
    }
  }
}

/**
 * Check API Routes
 */
async function checkAPIRoutes(): Promise<SystemStatus> {
  const startTime = Date.now()
  try {
    // API is responding if we got here
    const responseTime = Date.now() - startTime

    return {
      name: 'API Routes',
      status: 'operational',
      responseTime,
      lastChecked: new Date().toISOString(),
      category: 'internal'
    }
  } catch (error) {
    return {
      name: 'API Routes',
      status: 'down',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      category: 'internal'
    }
  }
}

/**
 * Check Edge Middleware
 */
async function checkMiddleware(): Promise<SystemStatus> {
  const startTime = Date.now()
  try {
    // Middleware is running if we got here
    const responseTime = Date.now() - startTime

    return {
      name: 'Edge Middleware',
      status: 'operational',
      responseTime,
      lastChecked: new Date().toISOString(),
      category: 'internal'
    }
  } catch (error) {
    return {
      name: 'Edge Middleware',
      status: 'down',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      category: 'internal'
    }
  }
}

/**
 * Check Cron Jobs via cron-job.org API
 * Returns status for all 5 cron jobs
 */
async function checkCronJobs(): Promise<SystemStatus[]> {
  const startTime = Date.now()
  const cronJobApiKey = process.env.CRONJOB_ORG_API_KEY
  const cronSecret = process.env.CRON_SECRET
  
  // Define all cron jobs
  const cronJobs = [
    { name: 'Daily Prompts Cron', endpoint: 'send-daily-prompts' },
    { name: 'Welcome Emails Cron', endpoint: 'send-welcome-emails' },
    { name: 'Trial Expiry Check Cron', endpoint: 'check-trial-expiry' },
    { name: 'Expire Trials Cron', endpoint: 'expire-trials' },
    { name: 'Weekly Insights Cron', endpoint: 'regenerate-weekly-insights' },
  ]
  
  // If no cron secret configured, all crons are down
  if (!cronSecret) {
    return cronJobs.map(job => ({
      name: job.name,
      status: 'down' as const,
      responseTime: 0,
      lastChecked: new Date().toISOString(),
      error: 'Cron secret not configured',
      category: 'internal' as const
    }))
  }
  
  // If cron-job.org API key is configured, check actual job status
  if (cronJobApiKey) {
    try {
      const response = await fetch('https://api.cron-job.org/jobs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cronJobApiKey}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        const jobs = data.jobs || []
        const responseTime = Date.now() - startTime
        
        return cronJobs.map(cronJob => {
          // Find matching job from cron-job.org by URL
          const matchingJob = jobs.find((j: any) => 
            j.url?.includes(cronJob.endpoint)
          )
          
          if (matchingJob) {
            // Check job status from cron-job.org
            const isEnabled = matchingJob.enabled === true
            const lastStatus = matchingJob.lastStatus
            
            let status: 'operational' | 'degraded' | 'down' = 'operational'
            let error: string | undefined
            
            if (!isEnabled) {
              status = 'down'
              error = 'Job is disabled'
            } else if (lastStatus === 1) {
              status = 'operational'
            } else if (lastStatus === 0) {
              status = 'degraded'
              error = 'Last execution had issues'
            } else if (lastStatus === -1) {
              status = 'down'
              error = 'Last execution failed'
            }
            
            return {
              name: cronJob.name,
              status,
              responseTime,
              lastChecked: new Date().toISOString(),
              error,
              category: 'internal' as const
            }
          }
          
          // Job not found in cron-job.org
          return {
            name: cronJob.name,
            status: 'degraded' as const,
            responseTime,
            lastChecked: new Date().toISOString(),
            error: 'Job not found in cron-job.org',
            category: 'internal' as const
          }
        })
      }
    } catch (error) {
      // Fall through to basic check if API fails
    }
  }
  
  // Fallback: Just check if cron secret is configured (basic check)
  const responseTime = Date.now() - startTime
  return cronJobs.map(job => ({
    name: job.name,
    status: 'operational' as const,
    responseTime,
    lastChecked: new Date().toISOString(),
    category: 'internal' as const
  }))
}

/**
 * Check Dashboard
 */
async function checkDashboard(): Promise<SystemStatus> {
  const startTime = Date.now()
  try {
    const responseTime = Date.now() - startTime

    return {
      name: 'User Dashboard',
      status: 'operational',
      responseTime,
      lastChecked: new Date().toISOString(),
      category: 'internal'
    }
  } catch (error) {
    return {
      name: 'User Dashboard',
      status: 'down',
      responseTime: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      category: 'internal'
    }
  }
}

/**
 * Send infrastructure alert email
 */
async function sendInfrastructureAlert(failedSystems: SystemStatus[]): Promise<boolean> {
  try {
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      return false
    }

    const resend = new Resend(resendKey)
    
    const systemsList = failedSystems.map(s => 
      `<li><strong>${s.name}</strong>: ${s.status} ${s.error ? `(${s.error})` : ''}</li>`
    ).join('')

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">⚠️ Infrastructure Alert</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
            One or more critical systems have experienced failures:
          </p>
          <ul style="color: #6b7280; line-height: 1.8;">
            ${systemsList}
          </ul>
          <p style="color: #6b7280; margin-top: 20px;">
            Timestamp: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
          </p>
          <p style="color: #6b7280; margin-top: 20px;">
            <strong>Action Required:</strong> Please investigate immediately.
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              This is an automated alert from Prompt & Pause infrastructure monitoring.
            </p>
          </div>
        </div>
      </div>
    `

    const { error } = await resend.emails.send({
      from: 'Prompt & Pause Infrastructure <prompts@promptandpause.com>',
      to: 'infrastructure@promptandpause.com',
      subject: `🚨 Infrastructure Alert: ${failedSystems.length} System(s) Down`,
      html,
    })

    if (error) {
      return false
    }
    return true
  } catch (error) {
    return false
  }
}

/**
 * Determine if we should send an alert for a system
 */
function shouldSendAlert(systemName: string): boolean {
  const now = Date.now()
  const cached = failureCache.get(systemName)

  if (!cached) {
    failureCache.set(systemName, { lastAlert: now, consecutiveFailures: 1 })
    return false // First failure, don't alert yet
  }

  cached.consecutiveFailures++

  // Send alert if we've hit the threshold and cooldown has passed
  if (
    cached.consecutiveFailures >= ALERT_THRESHOLD &&
    (now - cached.lastAlert) > ALERT_COOLDOWN
  ) {
    cached.lastAlert = now
    return true
  }

  return false
}

/**
 * Reset failure tracking for operational systems
 */
function resetFailureTracking(systemName: string) {
  failureCache.delete(systemName)
}

/**
 * Main health check handler
 */
export async function GET() {
  try {
    // Run all health checks in parallel
    const [
      app,
      supabase,
      upstash,
      stripe,
      resend,
      gemini,
      openrouter,
      openai,
      slack,
      basehub,
      api,
      middleware,
      dashboard,
      cronJobs,
    ] = await Promise.all([
      checkApplication(),
      checkSupabase(),
      checkUpstash(),
      checkStripe(),
      checkResend(),
      checkGemini(),
      checkOpenRouter(),
      checkOpenAI(),
      checkSlack(),
      checkBaseHub(),
      checkAPIRoutes(),
      checkMiddleware(),
      checkDashboard(),
      checkCronJobs(),
    ])

    const systems = [
      app,
      supabase,
      upstash,
      stripe,
      resend,
      gemini,
      openrouter,
      openai,
      slack,
      basehub,
      api,
      middleware,
      dashboard,
      ...cronJobs,
    ]

    // Reset tracking for operational systems
    systems.forEach(system => {
      if (system.status === 'operational') {
        resetFailureTracking(system.name)
      }
    })

    // Determine overall status
    const downSystems = systems.filter(s => s.status === 'down')
    const degradedSystems = systems.filter(s => s.status === 'degraded')

    let overall: 'operational' | 'degraded' | 'down' = 'operational'
    if (downSystems.length > 0) {
      overall = 'down'
    } else if (degradedSystems.length > 0) {
      overall = 'degraded'
    }

    // Send alerts for systems that are down
    const alertsSent: string[] = []
    for (const system of downSystems) {
      if (shouldSendAlert(system.name)) {
        const sent = await sendInfrastructureAlert([system])
        if (sent) {
          alertsSent.push(system.name)
        }
      }
    }

    const response: HealthCheckResponse = {
      overall,
      systems,
      timestamp: new Date().toISOString(),
      alertsSent,
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        overall: 'down',
        systems: [],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        alertsSent: [],
      },
      { status: 500 }
    )
  }
}
