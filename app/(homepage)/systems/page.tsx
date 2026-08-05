'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, AlertCircle, XCircle, Clock, Activity, ChevronDown, RefreshCw } from 'lucide-react'
import { SystemRow } from './_components/SystemRow'
import { useLenis } from '@/hooks/useLenis'

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

export default function SystemsPage() {
  useLenis()
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastManualRefresh, setLastManualRefresh] = useState<number>(0)
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0)

  const lastManualRefreshRef = useRef(lastManualRefresh)

  useEffect(() => {
    lastManualRefreshRef.current = lastManualRefresh
  }, [lastManualRefresh])

  const fetchHealthStatus = useCallback(async (isManualRefresh = false) => {
    // Check cooldown for manual refresh
    if (isManualRefresh) {
      const now = Date.now()
      const timeSinceLastRefresh = now - lastManualRefreshRef.current
      const cooldownMs = 3 * 60 * 1000 // 3 minutes
      
      if (timeSinceLastRefresh < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - timeSinceLastRefresh) / 1000)
        setCooldownRemaining(remaining)
        return
      }
    }
    
    try {
      if (isManualRefresh) {
        setRefreshing(true)
        const refreshTime = Date.now()
        lastManualRefreshRef.current = refreshTime
        setLastManualRefresh(refreshTime)
        setCooldownRemaining(0)
      }
      
      const response = await fetch('/api/health', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch health status')
      }

      const text = await response.text()
      if (!text || !text.trim()) {
        throw new Error('Empty response from health check')
      }
      const data: HealthCheckResponse = JSON.parse(text)
      setHealthData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
      if (isManualRefresh) setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchHealthStatus()
    
    // Poll every 5 minutes (300000ms) to reduce API costs
    const interval = setInterval(fetchHealthStatus, 300000)
    
    return () => clearInterval(interval)
  }, [fetchHealthStatus])
  
  // Cooldown timer effect
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => {
        setCooldownRemaining(prev => Math.max(0, prev - 1))
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [cooldownRemaining])

  const getStatusIcon = (status: SystemStatus['status']) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="w-5 h-5 text-indigo-600" />
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'down':
        return <XCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getStatusColor = (status: SystemStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'bg-indigo-600'
      case 'degraded':
        return 'bg-yellow-500'
      case 'down':
        return 'bg-red-50'
    }
  }

  const getStatusText = (status: SystemStatus['status']) => {
    switch (status) {
      case 'operational':
        return 'Operational'
      case 'degraded':
        return 'Degraded Performance'
      case 'down':
        return 'Down'
    }
  }

  const getOverallStatusBadge = () => {
    if (!healthData) return null

    const { overall } = healthData

    const colors = {
      operational: 'bg-indigo-500/10 text-slate-900 border-indigo-600/20',
      degraded: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      down: 'bg-red-50 text-red-600 border-red-200',
    }

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${colors[overall]}`}>
        {getStatusIcon(overall)}
        <span className="font-medium">
          {overall === 'operational' && 'All Systems Operational'}
          {overall === 'degraded' && 'Some Systems Degraded'}
          {overall === 'down' && 'System Issues Detected'}
        </span>
      </div>
    )
  }

  const groupedSystems = healthData?.systems.reduce((acc, system) => {
    if (!acc[system.category]) {
      acc[system.category] = []
    }
    acc[system.category].push(system)
    return acc
  }, {} as Record<string, SystemStatus[]>)

  const categoryLabels = {
    core: 'Core Infrastructure',
    payment: 'Payment Systems',
    communication: 'Communication Services',
    ai: 'AI Services',
    integration: 'Integrations',
    internal: 'Internal Systems',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-100 to-slate-200 relative">
      {/* Navigation */}
      <nav className="relative z-10 border-b border-slate-200/50 bg-slate-100/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link 
            href="/" 
            className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Activity className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              System Status
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-4">
            Real-time monitoring of Prompt & Pause infrastructure and services
          </p>
          <button
            onClick={() => fetchHealthStatus(true)}
            disabled={refreshing || cooldownRemaining > 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={cooldownRemaining > 0 ? `Please wait ${cooldownRemaining}s before refreshing again` : 'Refresh status now'}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Refresh Status'}
          </button>
          
          {/* Overall Status Badge */}
          <div className="mb-6">
            {loading ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200 bg-slate-100/60 backdrop-blur-sm">
                <Clock className="w-5 h-5 text-slate-500 animate-pulse" />
                <span className="text-slate-900 font-medium">Loading system status...</span>
              </div>
            ) : error ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-red-500/30 bg-red-50 text-red-600 backdrop-blur-sm">
                <XCircle className="w-5 h-5" />
                <span className="font-medium text-red-800">Unable to fetch status</span>
              </div>
            ) : (
              getOverallStatusBadge()
            )}
          </div>

          {/* Last Updated */}
          {healthData && (
            <p className="text-sm text-slate-500 mt-4">
              Last updated: {new Date(healthData.timestamp).toLocaleString('en-GB', {
                dateStyle: 'medium',
                timeStyle: 'medium',
                timeZone: 'Europe/London'
              })} GMT • Auto-refreshes every 5 minutes
            </p>
          )}
        </div>

        {/* Systems List */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="h-5 bg-slate-200/50 rounded w-48 mb-3 animate-pulse"></div>
                <ul className="space-y-2">
                  <li className="h-14 bg-slate-100/40 border border-slate-200/50 rounded-lg animate-pulse"></li>
                  <li className="h-14 bg-slate-100/40 border border-slate-200/50 rounded-lg animate-pulse"></li>
                </ul>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center backdrop-blur-sm">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading Status</h3>
            <p className="text-slate-600">{error}</p>
            <button
              onClick={() => fetchHealthStatus()}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              Retry
            </button>
          </div>
        ) : groupedSystems ? (
          <>
            <div className="space-y-8 max-w-3xl mx-auto">
              {Object.entries(groupedSystems).map(([category, systems]) => (
                <section key={category}>
                  <h2 className="text-lg font-semibold text-slate-900 mb-3">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h2>
                  <ul className="space-y-2">
                    {systems.map((system) => (
                      <SystemRow
                        key={system.name}
                        name={system.name}
                        status={system.status}
                        optional={
                          system.name === 'Upstash Redis' ||
                          system.name === 'OpenAI (Backup)' ||
                          system.name === 'Slack Integration' ||
                          system.name === 'BaseHub CMS'
                        }
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            {/* Incidents Section */}
            {healthData && (() => {
              const incidents = healthData.systems.filter(
                (s) => (s.status === 'down' || s.status === 'degraded') && s.error
              )
              
              if (incidents.length === 0) return null
              
              return (
                <details className="mt-12 max-w-3xl mx-auto group">
                  <summary className="cursor-pointer flex items-center gap-3 text-slate-900 hover:text-slate-600 transition-colors list-none">
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-medium">
                      {incidents.length} active {incidents.length > 1 ? 'incidents' : 'incident'}
                    </span>
                  </summary>
                  <div className="mt-4 space-y-3 pl-7">
                    {incidents.map((incident) => (
                      <div
                        key={incident.name}
                        className="rounded-lg border border-slate-200/50 bg-slate-100/40 p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(incident.status)}
                          <span className="text-slate-900 font-medium">{incident.name}</span>
                        </div>
                        <p className="text-sm text-slate-500 ml-7">{incident.error}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )
            })()}
          </>
        ) : null}

        {/* Information Footer */}
        <div className="relative z-10 mt-16 p-8 bg-slate-100/40 border border-slate-200/50 rounded-xl backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">About System Monitoring</h3>
          <div className="space-y-2 text-sm text-slate-500">
            <p>
              This page shows the real-time health status of all critical Prompt & Pause infrastructure components.
            </p>
            <p>
              Status checks run automatically every 5 minutes. You can also manually refresh anytime. 
              If a system experiences issues, our infrastructure team is automatically notified for immediate response.
            </p>
            <p className="flex items-center gap-2 text-slate-500 mt-4">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span className="font-medium text-slate-900">Operational</span> - System functioning normally
            </p>
            <p className="flex items-center gap-2 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span className="font-medium text-yellow-600">Degraded</span> - System responding slowly
            </p>
            <p className="flex items-center gap-2 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span className="font-medium text-red-600">Down</span> - System unavailable
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}



