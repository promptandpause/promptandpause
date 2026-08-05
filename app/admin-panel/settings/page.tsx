'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
        <div className="text-muted-foreground">Loading…</div>
      </div>
    )
  }

  if (!currentAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">{error || 'Unable to load admin profile'}</div>
      </div>
    )
  }

  if (!isSuperAdmin) {
    return (
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Configure application settings and features</p>
        </div>

        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Super Admin access is required to view and modify system settings.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Configure application settings and features</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger key="settings-tab" value="settings">
            <Sliders className="h-4 w-4 mr-2" />
            System Settings
          </TabsTrigger>
          <TabsTrigger key="features-tab" value="features">
            <ToggleLeft className="h-4 w-4 mr-2" />
            Feature Flags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {Object.entries(groupedSettings)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, categorySettings]) => (
              <Card key={category} className="shadow-none border">
                <CardHeader>
                  <CardTitle className="capitalize">{category}</CardTitle>
                  <CardDescription>
                    Configure {category} related settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {categorySettings.map((setting, i) => {
                    const currentValue = editedSettings[setting.key] ?? setting.value
                    const isEdited = editedSettings.hasOwnProperty(setting.key)
                    const showGbpValue =
                      !isEdited &&
                      isPriceRelatedKey(setting.key) &&
                      typeof setting.value === 'number'

                    return (
                      <div key={setting.key} className="space-y-6">
                        {i > 0 && <Separator />}

                        {setting.type === 'boolean' ? (
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <Label>{setting.key}</Label>
                                {isEdited && (
                                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                    Modified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{setting.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isEdited && (
                                <Button size="sm" variant="outline" onClick={() => handleSaveSetting(setting.key)}>
                                  <Save className="h-3 w-3" />
                                </Button>
                              )}
                              <Switch
                                checked={Boolean(currentValue)}
                                onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <Label>{setting.key}</Label>
                                {isEdited && (
                                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                                    Modified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{setting.description}</p>
                              {showGbpValue && (
                                <p className="text-xs text-muted-foreground">Current (GBP): {gbp.format(setting.value)}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isEdited && (
                                <Button size="sm" variant="outline" onClick={() => handleSaveSetting(setting.key)}>
                                  <Save className="h-3 w-3" />
                                </Button>
                              )}
                              {setting.type === 'number' ? (
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
                                  className="w-32"
                                />
                              ) : (
                                <Input
                                  value={currentValue ?? ''}
                                  onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                                  className="w-48"
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card className="shadow-none border">
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Enable or disable application features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {flags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No feature flags configured
                </div>
              ) : (
                flags.map((flag, i) => (
                  <div key={flag.key} className="space-y-6">
                    {i > 0 && <Separator />}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Label>{flag.name}</Label>
                          <Badge
                            variant="outline"
                            className={
                              flag.enabled
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-muted text-muted-foreground'
                            }
                          >
                            {flag.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{flag.description}</p>
                        <p className="text-xs text-muted-foreground">Key: {flag.key}</p>
                      </div>
                      <Switch
                        checked={flag.enabled}
                        onCheckedChange={(checked) => handleToggleFlag(flag.key, checked)}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => {
            setEditedSettings({})
            fetchData()
          }}
        >
          Discard Changes
        </Button>
        <Button
          onClick={() => Object.keys(editedSettings).forEach((key) => handleSaveSetting(key))}
          disabled={Object.keys(editedSettings).length === 0}
        >
          Save Configuration
        </Button>
      </div>
    </div>
  )
}
