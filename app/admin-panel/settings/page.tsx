'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Save, ToggleLeft, Sliders } from 'lucide-react'

interface SystemSetting {
  id: string
  key: string
  value: any
  category: string
  description: string
  type: string
  updated_at: string
}

interface FeatureFlag {
  id: string
  key: string
  name: string
  description: string
  enabled: boolean
  updated_at: string
}

interface CurrentAdmin {
  user_id: string
  email: string
  role: 'super_admin' | 'admin' | 'employee'
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [editedSettings, setEditedSettings] = useState<Record<string, any>>({})
  const [error, setError] = useState<string | null>(null)

  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null)
  const [meLoading, setMeLoading] = useState(true)

  const isSuperAdmin = currentAdmin?.role === 'super_admin'

  const loadMe = useCallback(async () => {
    try {
      setMeLoading(true)
      setError(null)
      const res = await fetch('/api/admin/admin-users/me')
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to load admin profile')
      }

      const data = await res.json()
      setCurrentAdmin(data.user || null)
    } catch (err: any) {
      setCurrentAdmin(null)
      setError(err?.message || 'Failed to load admin profile')
    } finally {
      setMeLoading(false)
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      setError(null)
      const [settingsRes, flagsRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/settings/feature-flags'),
      ])

      const normalizeSetting = (row: any): SystemSetting => {
        const key = String(row.key)
        const value = row.value

        let inferredType = row.type
        if (!inferredType) {
          if (typeof value === 'boolean') inferredType = 'boolean'
          else if (typeof value === 'number') inferredType = 'number'
          else inferredType = 'string'
        }

        return {
          id: String(row.id || key),
          key,
          value,
          category: String(row.category || 'general'),
          description: String(row.description || ''),
          type: String(inferredType),
          updated_at: String(row.updated_at || row.created_at || new Date().toISOString()),
        }
      }

      const normalizeFlag = (row: any): FeatureFlag => {
        const key = String(row.key || row.name)
        const name = String(row.name || row.key || key)
        const enabled = Boolean(row.enabled ?? row.is_enabled ?? false)

        return {
          id: String(row.id || key),
          key,
          name,
          description: String(row.description || ''),
          enabled,
          updated_at: String(row.updated_at || row.created_at || new Date().toISOString()),
        }
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings((data.settings || []).map(normalizeSetting))
      } else {
        const data = await settingsRes.json().catch(() => null)
        setError(data?.error || 'Failed to load system settings')
      }

      if (flagsRes.ok) {
        const data = await flagsRes.json()
        setFlags((data.flags || []).map(normalizeFlag))
      } else {
        const data = await flagsRes.json().catch(() => null)
        setError((prev) => prev || data?.error || 'Failed to load feature flags')
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  useEffect(() => {
    if (meLoading) return
    if (!isSuperAdmin) {
      setLoading(false)
      return
    }
    fetchData()
  }, [fetchData, isSuperAdmin, meLoading])

  const handleSettingChange = (key: string, value: any) => {
    setEditedSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveSetting = async (key: string) => {
    try {
      if (!isSuperAdmin) {
        throw new Error('Forbidden: Super admin access required')
      }
      setError(null)
      const value = editedSettings[key]
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to save setting')
      }

      if (res.ok) {
        setEditedSettings((prev) => {
          const next = { ...prev }
          delete next[key]
          return next
        })
        fetchData()
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to save setting')
    }
  }

  const handleToggleFlag = async (key: string, enabled: boolean) => {
    try {
      if (!isSuperAdmin) {
        throw new Error('Forbidden: Super admin access required')
      }
      setError(null)
      const res = await fetch('/api/admin/settings/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to update feature flag')
      }

      if (res.ok) {
        fetchData()
      }
    } catch (error: any) {
      setError(error?.message || 'Failed to update feature flag')
    }
  }

  const isGbpFirstSettingKey = (key: string) => {
    const k = key.toLowerCase()
    return k.includes('gbp') || k.includes('£')
  }

  const isPriceRelatedKey = (key: string) => {
    const k = key.toLowerCase()
    return (
      k.includes('price') ||
      k.includes('amount') ||
      k.includes('currency') ||
      k.includes('stripe_price')
    )
  }

  const gbp = useMemo(() => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }, [])

  const groupedSettings = useMemo(() => {
    const grouped = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = []
      }
      acc[setting.category].push(setting)
      return acc
    }, {} as Record<string, SystemSetting[]>)

    // Stable sorting per category: GBP-related + price-related first, then alpha by key
    for (const category of Object.keys(grouped)) {
      grouped[category] = grouped[category]
        .slice()
        .sort((a, b) => {
          const aIsGbp = isGbpFirstSettingKey(a.key)
          const bIsGbp = isGbpFirstSettingKey(b.key)
          if (aIsGbp !== bIsGbp) return aIsGbp ? -1 : 1

          const aIsPrice = isPriceRelatedKey(a.key)
          const bIsPrice = isPriceRelatedKey(b.key)
          if (aIsPrice !== bIsPrice) return aIsPrice ? -1 : 1

          return a.key.localeCompare(b.key)
        })
    }

    return grouped
  }, [settings])

  if (meLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-neutral-500">Loading…</div>
      </div>
    )
  }

  if (!currentAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-neutral-500">{error || 'Unable to load admin profile'}</div>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="h-full flex flex-col p-6 gap-6 w-full max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">System Settings</h1>
          <p className="text-sm text-neutral-500">Configure application settings and features</p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Super Admin access is required to view and modify system settings.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-neutral-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6 gap-6 w-full max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">System Settings</h1>
        <p className="text-sm text-neutral-500">Configure application settings and features</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="bg-neutral-100 border border-neutral-200">
          <TabsTrigger key="settings-tab" value="settings" className="data-[state=active]:bg-white">
            <Sliders className="h-4 w-4 mr-2" />
            System Settings
          </TabsTrigger>
          <TabsTrigger key="features-tab" value="features" className="data-[state=active]:bg-white">
            <ToggleLeft className="h-4 w-4 mr-2" />
            Feature Flags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {Object.entries(groupedSettings)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, categorySettings]) => (
            <Card key={category} className="bg-white border-neutral-200">
              <CardHeader>
                <CardTitle className="text-neutral-900 capitalize">{category}</CardTitle>
                <CardDescription className="text-neutral-500">
                  Configure {category} related settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categorySettings.map((setting) => {
                  const currentValue = editedSettings[setting.key] ?? setting.value
                  const isEdited = editedSettings.hasOwnProperty(setting.key)
                  const showGbpValue =
                    !isEdited &&
                    isPriceRelatedKey(setting.key) &&
                    typeof setting.value === 'number'

                  return (
                    <div key={setting.key} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-neutral-900">{setting.key}</h4>
                          {isEdited && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Modified
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">{setting.description}</p>
                        {showGbpValue && (
                          <p className="text-xs text-neutral-500 mt-1">Current (GBP): {gbp.format(setting.value)}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {setting.type === 'boolean' ? (
                          <Switch
                            checked={Boolean(currentValue)}
                            onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        ) : setting.type === 'number' ? (
                          <Input
                            type="number"
                            value={currentValue ?? ''}
                            onChange={(e) => {
                              const raw = e.target.value
                              if (raw === '') {
                                handleSettingChange(setting.key, null)
                                return
                              }
                              const parsed = Number(raw)
                              handleSettingChange(setting.key, Number.isFinite(parsed) ? parsed : null)
                            }}
                            className="w-32 bg-white border-neutral-200 text-neutral-900"
                          />
                        ) : (
                          <Input
                            value={currentValue ?? ''}
                            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                            className="w-48 bg-white border-neutral-200 text-neutral-900"
                          />
                        )}

                        {isEdited && (
                          <Button
                            size="sm"
                            onClick={() => handleSaveSetting(setting.key)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card className="bg-white border-neutral-200">
            <CardHeader>
              <CardTitle className="text-neutral-900">Feature Flags</CardTitle>
              <CardDescription className="text-neutral-500">
                Enable or disable application features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {flags.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  No feature flags configured
                </div>
              ) : (
                flags.map((flag) => (
                  <div key={flag.key} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-neutral-900">{flag.name}</h4>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            flag.enabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                          }`}
                        >
                          {flag.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">{flag.description}</p>
                      <p className="text-xs text-neutral-500 mt-1">Key: {flag.key}</p>
                    </div>

                    <Switch
                      checked={flag.enabled}
                      onCheckedChange={(checked) => handleToggleFlag(flag.key, checked)}
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
