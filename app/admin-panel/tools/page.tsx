'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Bell, 
  Users, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Play,
  Eye,
  Mail,
  Settings2,
  Sparkles
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ToolResult {
  success: boolean
  message?: string
  data?: any
}

function AIModuleTester() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ToolResult | null>(null)
  const [responseData, setResponseData] = useState<any>(null)
  const [module, setModule] = useState('daily_prompt')
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [weekOffset, setWeekOffset] = useState('0')
  const [monthOffset, setMonthOffset] = useState('1')
  const [requestPayload, setRequestPayload] = useState<any>(null)

  const moduleOptions = [
    {
      value: 'daily_prompt',
      label: 'Daily Prompt',
      description: 'Generate a daily reflection prompt (no save)'
    },
    {
      value: 'daily_affirmation',
      label: 'Daily Affirmation',
      description: 'Generate a short affirmation for the user'
    },
    {
      value: 'weekly_insights',
      label: 'Weekly Insights',
      description: 'Generate weekly digest + AI insights'
    },
    {
      value: 'monthly_summary',
      label: 'Monthly Summary',
      description: 'Generate monthly reflection summary'
    },
  ]

  const activeModule = moduleOptions.find((option) => option.value === module)
  const showWeekOffset = module === 'weekly_insights'
  const showMonthOffset = module === 'monthly_summary'

  async function runTest() {
    setLoading(true)
    setResult(null)
    setResponseData(null)

    const payload: Record<string, any> = { module }
    if (userId.trim()) payload.userId = userId.trim()
    if (userEmail.trim()) payload.userEmail = userEmail.trim()
    if (showWeekOffset) payload.weekOffset = Number(weekOffset) || 0
    if (showMonthOffset) payload.monthOffset = Number(monthOffset) || 1

    setRequestPayload(payload)

    try {
      const response = await fetch('/api/admin/ai-module-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      const success = response.ok && data?.success !== false
      setResponseData(data)
      setResult({
        success,
        message: data?.message || (success ? 'Test completed' : 'Test failed'),
        data,
      })
    } catch (error: any) {
      setResult({ success: false, message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-none border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            AI Module Tester
          </CardTitle>
          <CardDescription>
            Run test generations for AI modules and inspect the responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Module</p>
            <Select value={module} onValueChange={setModule}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                {moduleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeModule && (
              <p className="text-xs text-muted-foreground">{activeModule.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Target user (optional)</p>
            <Input
              value={userEmail}
              onChange={(event) => setUserEmail(event.target.value)}
              placeholder="User email (defaults to you)"
            />
            <Input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="User ID (optional)"
            />
            <p className="text-xs text-muted-foreground">Provide email or ID to test a specific user.</p>
          </div>
        </div>

        {(showWeekOffset || showMonthOffset) && (
          <div className="grid gap-4 md:grid-cols-2">
            {showWeekOffset && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Week offset</p>
                <Input
                  value={weekOffset}
                  onChange={(event) => setWeekOffset(event.target.value)}
                  placeholder="0 = current week, 1 = last week"
                />
              </div>
            )}
            {showMonthOffset && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Month offset</p>
                <Input
                  value={monthOffset}
                  onChange={(event) => setMonthOffset(event.target.value)}
                  placeholder="1 = last month"
                />
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={runTest}
            disabled={loading}
            className="gap-2"
          >
            <Sparkles className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
            Run Test
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success
              ? 'border-emerald-500/20 bg-emerald-500/10'
              : 'border-destructive/40 bg-destructive/10'
          }`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <span className={`font-medium ${
                result.success ? 'text-emerald-600' : 'text-destructive'
              }`}>
                {result.message}
              </span>
            </div>
          </div>
        )}

        {responseData && (
          <div className="space-y-3">
            {requestPayload && (
              <details className="rounded-lg border bg-muted p-3">
                <summary className="cursor-pointer text-sm text-muted-foreground">Request payload</summary>
                <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-48">
                  {JSON.stringify(requestPayload, null, 2)}
                </pre>
              </details>
            )}
            <details className="rounded-lg border bg-muted p-3" open>
              <summary className="cursor-pointer text-sm text-muted-foreground">Response</summary>
              <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-72">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            </details>
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ToolsPage() {
  return (
    <div className="h-full flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Tools</h1>
        <p className="text-muted-foreground">Utilities for managing notifications, user preferences, and system maintenance</p>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="notifications" className="flex-1">
        <TabsList>
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
          <TabsTrigger value="ai-tester" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Tester
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

        <TabsContent value="ai-tester" className="mt-6">
          <AIModuleTester />
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
      <Card className="shadow-none border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Notification Sync
          </CardTitle>
          <CardDescription>
            Send daily prompts to users who should have received them today but didn't
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-3">
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
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Send Notifications
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'border-emerald-500/20 bg-emerald-500/10' 
              : 'border-destructive/40 bg-destructive/10'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <span className={`font-medium ${
                result.success ? 'text-emerald-600' : 'text-destructive'
              }`}>
                {result.message}
              </span>
            </div>
            {result.data && (
              <div className="mt-3 text-sm">
                {result.data.stats && (
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-muted-foreground text-xs">Total Users</p>
                      <p className="text-xl font-semibold">{result.data.stats.totalUsers}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-muted-foreground text-xs">Sent</p>
                      <p className="text-xl font-semibold text-emerald-600">{result.data.stats.sent}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-muted-foreground text-xs">Skipped</p>
                      <p className="text-xl font-semibold text-yellow-600">{result.data.stats.skipped}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-muted-foreground text-xs">Errors</p>
                      <p className="text-xl font-semibold text-destructive">{result.data.stats.errors}</p>
                    </div>
                  </div>
                )}
                {result.data.results && result.data.results.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View Details ({result.data.results.length} users)
                    </summary>
                    <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(result.data.results, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        )}

        {reportData && !result?.data && (
          <div className="mt-4 p-4 bg-muted rounded-lg border">
            <h4 className="font-medium text-foreground mb-3">Today's Report: {reportData.todayDayOfWeek}</h4>
            {reportData.summary && (
              <div className="grid grid-cols-5 gap-3 mb-4">
                <div className="rounded-lg border bg-card p-3 text-center">
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="text-lg font-semibold">{reportData.summary.totalUsers}</p>
                </div>
                <div className="rounded-lg border bg-card p-3 text-center">
                  <p className="text-muted-foreground text-xs">Reminders On</p>
                  <p className="text-lg font-semibold">{reportData.summary.withDailyReminders}</p>
                </div>
                <div className="rounded-lg border bg-card p-3 text-center">
                  <p className="text-muted-foreground text-xs">Should Receive</p>
                  <p className="text-lg font-semibold">{reportData.summary.shouldReceiveToday}</p>
                </div>
                <div className="rounded-lg border bg-card p-3 text-center">
                  <p className="text-muted-foreground text-xs">Has Prompt</p>
                  <p className="text-lg font-semibold text-emerald-600">{reportData.summary.hasPromptToday}</p>
                </div>
                <div className="rounded-lg border bg-card p-3 text-center">
                  <p className="text-muted-foreground text-xs">Needs Prompt</p>
                  <p className="text-lg font-semibold text-orange-600">{reportData.summary.needsPrompt}</p>
                </div>
              </div>
            )}
            {reportData.usersNeedingPrompt && reportData.usersNeedingPrompt.length > 0 && (
              <details>
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Users needing prompts ({reportData.usersNeedingPrompt.length})
                </summary>
                <div className="mt-2 max-h-48 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
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
        </CardContent>
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
      <Card className="shadow-none border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Fix User Preferences
          </CardTitle>
          <CardDescription>
            Fix users with missing custom_days, prompt_frequency, or daily_reminders settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-3">
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
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Apply Fix
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'border-emerald-500/20 bg-emerald-500/10' 
              : 'border-destructive/40 bg-destructive/10'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <span className={`font-medium ${
                result.success ? 'text-emerald-600' : 'text-destructive'
              }`}>
                {result.message}
              </span>
            </div>
            {result.data?.stats && (
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-muted-foreground text-xs">Total Users</p>
                  <p className="text-xl font-semibold">{result.data.stats.totalUsers}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-muted-foreground text-xs">Updated</p>
                  <p className="text-xl font-semibold text-emerald-600">{result.data.stats.updated}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-muted-foreground text-xs">Skipped</p>
                  <p className="text-xl font-semibold text-muted-foreground">{result.data.stats.skipped}</p>
                </div>
              </div>
            )}
            {result.data?.results && (
              <details className="mt-3">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground text-sm">
                  View Details
                </summary>
                <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(result.data.results.filter((r: any) => r.status !== 'skipped'), null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {reportData && !result?.data && (
          <div className="mt-4 p-4 bg-muted rounded-lg border">
            <h4 className="font-medium text-foreground mb-3">Current Status</h4>
            {reportData.stats && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-muted-foreground text-xs">Total Users</p>
                  <p className="text-lg font-semibold">{reportData.stats.total}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-muted-foreground text-xs">Custom Days Set</p>
                  <p className="text-lg font-semibold text-emerald-600">{reportData.stats.custom_days_set}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-muted-foreground text-xs">Custom Days Null</p>
                  <p className="text-lg font-semibold text-orange-600">{reportData.stats.custom_days_null}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-muted-foreground text-xs">Reminders True</p>
                  <p className="text-lg font-semibold text-emerald-600">{reportData.stats.daily_reminders_true}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-muted-foreground text-xs">Reminders Null</p>
                  <p className="text-lg font-semibold text-orange-600">{reportData.stats.daily_reminders_null}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-muted-foreground text-xs">Needs Fix</p>
                  <p className="text-lg font-semibold text-destructive">{reportData.needsFixCount}</p>
                </div>
              </div>
            )}
          </div>
        )}
        </CardContent>
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
      <Card className="shadow-none border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-green-600" />
            Test Daily Prompt
          </CardTitle>
          <CardDescription>
            Send a test prompt email to yourself and view system diagnostics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-3">
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
            className="gap-2"
          >
            <Mail className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
            Send Test to Me
          </Button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border ${
            result.success 
              ? 'border-emerald-500/20 bg-emerald-500/10' 
              : 'border-destructive/40 bg-destructive/10'
          }`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <span className={`font-medium ${
                result.success ? 'text-emerald-600' : 'text-destructive'
              }`}>
                {result.message}
              </span>
            </div>
            {result.data?.results && (
              <pre className="mt-3 p-3 bg-muted rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(result.data.results, null, 2)}
              </pre>
            )}
          </div>
        )}

        {diagnostics && (
          <div className="mt-4 p-4 bg-muted rounded-lg border">
            <h4 className="font-medium text-foreground mb-3">System Diagnostics</h4>
            
            {diagnostics.stats && (
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-muted-foreground text-xs">Total Users</p>
                  <p className="text-lg font-semibold">{diagnostics.stats.total_users_with_preferences}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-muted-foreground text-xs">Reminders Enabled</p>
                  <p className="text-lg font-semibold text-emerald-600">{diagnostics.stats.daily_reminders_enabled}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-muted-foreground text-xs">Reminders Disabled</p>
                  <p className="text-lg font-semibold text-muted-foreground">{diagnostics.stats.daily_reminders_disabled}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-muted-foreground text-xs">Reminders Null</p>
                  <p className="text-lg font-semibold text-orange-600">{diagnostics.stats.daily_reminders_null}</p>
                </div>
              </div>
            )}

            {diagnostics.todayDebug && (
              <div className="mb-4 p-3 rounded-lg border border-blue-500/20 bg-blue-500/10">
                <p className="text-sm text-blue-600">
                  <strong>Today:</strong> {diagnostics.todayDebug.today} | 
                  <strong> Users with today in custom_days:</strong> {diagnostics.todayDebug.usersWithTodayInCustomDays}
                </p>
              </div>
            )}

            {diagnostics.environment && (
              <div className="mb-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Environment</p>
                <div className="flex gap-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    diagnostics.environment.RESEND_API_KEY ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                  }`}>
                    RESEND_API_KEY: {diagnostics.environment.RESEND_API_KEY ? '✓' : '✗'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    diagnostics.environment.CRON_SECRET ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                  }`}>
                    CRON_SECRET: {diagnostics.environment.CRON_SECRET ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            )}

            {diagnostics.recentCronRuns && diagnostics.recentCronRuns.length > 0 && (
              <details>
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground text-sm">
                  Recent Cron Runs ({diagnostics.recentCronRuns.length})
                </summary>
                <div className="mt-2 max-h-48 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
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
                              run.status === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
                            }`}>
                              {run.status}
                            </span>
                          </td>
                          <td className="p-2">{run.total_users}</td>
                          <td className="p-2 text-emerald-600">{run.successful_sends}</td>
                          <td className="p-2 text-destructive">{run.failed_sends}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  )
}
