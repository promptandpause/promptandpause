'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings as SettingsIcon, Save, ToggleLeft, Sliders } from 'lucide-react'

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

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [editedSettings, setEditedSettings] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [settingsRes, flagsRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/settings/feature-flags'),
      ])

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data.settings)
      }

      if (flagsRes.ok) {
        const data = await flagsRes.json()
        setFlags(data.flags)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (key: string, value: any) => {
    setEditedSettings({ ...editedSettings, [key]: value })
  }

  const handleSaveSetting = async (key: string) => {
    try {
      const value = editedSettings[key]
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })

      if (res.ok) {
        delete editedSettings[key]
        setEditedSettings({ ...editedSettings })
        fetchData()
      }
    } catch (error) {
      console.error('Error saving setting:', error)
    }
  }

  const handleToggleFlag = async (key: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/admin/settings/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled }),
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error toggling flag:', error)
    }
  }

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = []
    }
    acc[setting.category].push(setting)
    return acc
  }, {} as Record<string, SystemSetting[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
        <p className="text-slate-400">Configure application settings and features</p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger key="settings-tab" value="settings" className="data-[state=active]:bg-slate-800">
            <Sliders className="h-4 w-4 mr-2" />
            System Settings
          </TabsTrigger>
          <TabsTrigger key="features-tab" value="features" className="data-[state=active]:bg-slate-800">
            <ToggleLeft className="h-4 w-4 mr-2" />
            Feature Flags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {Object.entries(groupedSettings).map(([category, categorySettings]) => (
            <Card key={category} className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white capitalize">{category}</CardTitle>
                <CardDescription className="text-slate-400">
                  Configure {category} related settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categorySettings.map((setting) => {
                  const currentValue = editedSettings[setting.key] ?? setting.value
                  const isEdited = editedSettings.hasOwnProperty(setting.key)

                  return (
                    <div key={setting.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-white">{setting.key}</h4>
                          {isEdited && (
                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-400/30">
                              Modified
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{setting.description}</p>
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
                            value={currentValue}
                            onChange={(e) => handleSettingChange(setting.key, parseFloat(e.target.value))}
                            className="w-32 bg-slate-800 border-slate-700 text-white"
                          />
                        ) : (
                          <Input
                            value={currentValue}
                            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                            className="w-48 bg-slate-800 border-slate-700 text-white"
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
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Feature Flags</CardTitle>
              <CardDescription className="text-slate-400">
                Enable or disable application features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {flags.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No feature flags configured
                </div>
              ) : (
                flags.map((flag) => (
                  <div key={flag.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-white">{flag.name}</h4>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            flag.enabled
                              ? 'bg-green-500/10 text-green-400 border-green-400/30'
                              : 'bg-slate-500/10 text-slate-400 border-slate-400/30'
                          }`}
                        >
                          {flag.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{flag.description}</p>
                      <p className="text-xs text-slate-500 mt-1">Key: {flag.key}</p>
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
