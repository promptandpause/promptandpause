'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Wrench, 
  Bell, 
  Users, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Play,
  Eye,
  Mail,
  Settings2
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ToolResult {
  success: boolean
  message?: string
  data?: any
}

export default function ToolsPage() {
  return (
    <div className="h-full flex flex-col p-6 gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Wrench className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-semibold text-neutral-900">Admin Tools</h1>
        </div>
        <p className="text-sm text-neutral-500">Utilities for managing notifications, user preferences, and system maintenance</p>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="notifications" className="flex-1">
        <TabsList className="bg-neutral-100 border border-neutral-200">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings2 className="h-4 w-4" />
            User Preferences
          </TabsTrigger>
          <TabsTrigger value="prompts" className="gap-2">
            <Mail className="h-4 w-4" />
            Test Prompts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSyncTool />
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <UserPreferencesFixTool />
        </TabsContent>

        <TabsContent value="prompts" className="mt-6">
          <TestPromptTool />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NotificationSyncTool() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ToolResult | null>(null)
  const [reportData, setReportData] = useState<any>(null)

  async function fetchReport() {
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch('/api/admin/sync-notifications')
      const data = await response.json()
      setReportData(data)
      setResult({ success: true, message: 'Report loaded successfully' })
    } catch (error: any) {
      setResult({ success: false, message: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function runSync(dryRun: boolean) {
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch('/api/admin/sync-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun })
      })
      const data = await response.json()
      setResult({ 
        success: data.success, 
        message: dryRun ? 'Dry run completed' : 'Sync completed',
        data 
      })
    } catch (error: any) {
      setResult({ success: false, message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Notification Sync
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Send daily prompts to users who should have received them today but didn't
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Button 
            onClick={fetchReport} 
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            View Report
          </Button>
          <Button 
            onClick={() => runSync(true)} 
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Dry Run
          </Button>
          <Button 
            onClick={() => runSync(false)} 
            disabled={loading}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Send Notifications
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </span>
            </div>
            {result.data && (
              <div className="mt-3 text-sm">
                {result.data.stats && (
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-white p-3 rounded border">
                      <p className="text-gray-500 text-xs">Total Users</p>
                      <p className="text-xl font-semibold">{result.data.stats.totalUsers}</p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-gray-500 text-xs">Sent</p>
                      <p className="text-xl font-semibold text-green-600">{result.data.stats.sent}</p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-gray-500 text-xs">Skipped</p>
                      <p className="text-xl font-semibold text-yellow-600">{result.data.stats.skipped}</p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-gray-500 text-xs">Errors</p>
                      <p className="text-xl font-semibold text-red-600">{result.data.stats.errors}</p>
                    </div>
                  </div>
                )}
                {result.data.results && result.data.results.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                      View Details ({result.data.results.length} users)
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(result.data.results, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        )}

        {reportData && !result?.data && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-3">Today's Report: {reportData.todayDayOfWeek}</h4>
            {reportData.summary && (
              <div className="grid grid-cols-5 gap-3 mb-4">
                <div className="bg-white p-3 rounded border text-center">
                  <p className="text-gray-500 text-xs">Total</p>
                  <p className="text-lg font-semibold">{reportData.summary.totalUsers}</p>
                </div>
                <div className="bg-white p-3 rounded border text-center">
                  <p className="text-gray-500 text-xs">Reminders On</p>
                  <p className="text-lg font-semibold">{reportData.summary.withDailyReminders}</p>
                </div>
                <div className="bg-white p-3 rounded border text-center">
                  <p className="text-gray-500 text-xs">Should Receive</p>
                  <p className="text-lg font-semibold">{reportData.summary.shouldReceiveToday}</p>
                </div>
                <div className="bg-white p-3 rounded border text-center">
                  <p className="text-gray-500 text-xs">Has Prompt</p>
                  <p className="text-lg font-semibold text-green-600">{reportData.summary.hasPromptToday}</p>
                </div>
                <div className="bg-white p-3 rounded border text-center">
                  <p className="text-gray-500 text-xs">Needs Prompt</p>
                  <p className="text-lg font-semibold text-orange-600">{reportData.summary.needsPrompt}</p>
                </div>
              </div>
            )}
            {reportData.usersNeedingPrompt && reportData.usersNeedingPrompt.length > 0 && (
              <details>
                <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                  Users needing prompts ({reportData.usersNeedingPrompt.length})
                </summary>
                <div className="mt-2 max-h-48 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Custom Days</th>
                        <th className="text-left p-2">Free?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.usersNeedingPrompt.map((user: any, i: number) => (
                        <tr key={i} className="border-b">
                          <td className="p-2">{user.email}</td>
                          <td className="p-2">{user.custom_days?.join(', ') || 'Default'}</td>
                          <td className="p-2">{user.is_free ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

function UserPreferencesFixTool() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ToolResult | null>(null)
  const [reportData, setReportData] = useState<any>(null)

  async function fetchReport() {
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch('/api/admin/fix-user-preferences')
      const data = await response.json()
      setReportData(data)
      setResult({ success: true, message: 'Report loaded successfully' })
    } catch (error: any) {
      setResult({ success: false, message: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function runFix(dryRun: boolean) {
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch('/api/admin/fix-user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun })
      })
      const data = await response.json()
      setResult({ 
        success: data.success, 
        message: dryRun ? 'Dry run completed' : 'Fix applied',
        data 
      })
    } catch (error: any) {
      setResult({ success: false, message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Fix User Preferences
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Fix users with missing custom_days, prompt_frequency, or daily_reminders settings
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Button 
            onClick={fetchReport} 
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            View Report
          </Button>
          <Button 
            onClick={() => runFix(true)} 
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Dry Run
          </Button>
          <Button 
            onClick={() => runFix(false)} 
            disabled={loading}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Apply Fix
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </span>
            </div>
            {result.data?.stats && (
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500 text-xs">Total Users</p>
                  <p className="text-xl font-semibold">{result.data.stats.totalUsers}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500 text-xs">Updated</p>
                  <p className="text-xl font-semibold text-green-600">{result.data.stats.updated}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500 text-xs">Skipped</p>
                  <p className="text-xl font-semibold text-gray-600">{result.data.stats.skipped}</p>
                </div>
              </div>
            )}
            {result.data?.results && (
              <details className="mt-3">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-800 text-sm">
                  View Details
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(result.data.results.filter((r: any) => r.status !== 'skipped'), null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {reportData && !result?.data && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-3">Current Status</h4>
            {reportData.stats && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500 text-xs">Total Users</p>
                  <p className="text-lg font-semibold">{reportData.stats.total}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500 text-xs">Custom Days Set</p>
                  <p className="text-lg font-semibold text-green-600">{reportData.stats.custom_days_set}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500 text-xs">Custom Days Null</p>
                  <p className="text-lg font-semibold text-orange-600">{reportData.stats.custom_days_null}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500 text-xs">Reminders True</p>
                  <p className="text-lg font-semibold text-green-600">{reportData.stats.daily_reminders_true}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500 text-xs">Reminders Null</p>
                  <p className="text-lg font-semibold text-orange-600">{reportData.stats.daily_reminders_null}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500 text-xs">Needs Fix</p>
                  <p className="text-lg font-semibold text-red-600">{reportData.needsFixCount}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

function TestPromptTool() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ToolResult | null>(null)
  const [diagnostics, setDiagnostics] = useState<any>(null)

  async function fetchDiagnostics() {
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch('/api/admin/test-daily-prompt')
      const data = await response.json()
      setDiagnostics(data)
      setResult({ success: true, message: 'Diagnostics loaded' })
    } catch (error: any) {
      setResult({ success: false, message: error.message })
    } finally {
      setLoading(false)
    }
  }

  async function sendTestPrompt() {
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch('/api/admin/test-daily-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useRealPrompt: true })
      })
      const data = await response.json()
      setResult({ 
        success: data.success, 
        message: data.success ? 'Test prompt sent to your email' : 'Failed to send',
        data 
      })
    } catch (error: any) {
      setResult({ success: false, message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-600" />
              Test Daily Prompt
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Send a test prompt email to yourself and view system diagnostics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Button 
            onClick={fetchDiagnostics} 
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            View Diagnostics
          </Button>
          <Button 
            onClick={sendTestPrompt} 
            disabled={loading}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Mail className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
            Send Test to Me
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </span>
            </div>
            {result.data?.results && (
              <pre className="mt-3 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(result.data.results, null, 2)}
              </pre>
            )}
          </div>
        )}

        {diagnostics && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-3">System Diagnostics</h4>
            
            {diagnostics.stats && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500 text-xs">Total Users</p>
                  <p className="text-lg font-semibold">{diagnostics.stats.total_users_with_preferences}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500 text-xs">Reminders Enabled</p>
                  <p className="text-lg font-semibold text-green-600">{diagnostics.stats.daily_reminders_enabled}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500 text-xs">Reminders Disabled</p>
                  <p className="text-lg font-semibold text-gray-600">{diagnostics.stats.daily_reminders_disabled}</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-500 text-xs">Reminders Null</p>
                  <p className="text-lg font-semibold text-orange-600">{diagnostics.stats.daily_reminders_null}</p>
                </div>
              </div>
            )}

            {diagnostics.todayDebug && (
              <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Today:</strong> {diagnostics.todayDebug.today} | 
                  <strong> Users with today in custom_days:</strong> {diagnostics.todayDebug.usersWithTodayInCustomDays}
                </p>
              </div>
            )}

            {diagnostics.environment && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Environment</p>
                <div className="flex gap-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    diagnostics.environment.RESEND_API_KEY ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    RESEND_API_KEY: {diagnostics.environment.RESEND_API_KEY ? '✓' : '✗'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    diagnostics.environment.CRON_SECRET ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    CRON_SECRET: {diagnostics.environment.CRON_SECRET ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            )}

            {diagnostics.recentCronRuns && diagnostics.recentCronRuns.length > 0 && (
              <details>
                <summary className="cursor-pointer text-gray-600 hover:text-gray-800 text-sm">
                  Recent Cron Runs ({diagnostics.recentCronRuns.length})
                </summary>
                <div className="mt-2 max-h-48 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-2">Started</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Users</th>
                        <th className="text-left p-2">Sent</th>
                        <th className="text-left p-2">Failed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagnostics.recentCronRuns.map((run: any, i: number) => (
                        <tr key={i} className="border-b">
                          <td className="p-2">{new Date(run.started_at).toLocaleString()}</td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                              run.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {run.status}
                            </span>
                          </td>
                          <td className="p-2">{run.total_users}</td>
                          <td className="p-2 text-green-600">{run.successful_sends}</td>
                          <td className="p-2 text-red-600">{run.failed_sends}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
