'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Power, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface MaintenanceStatusProps {
  onStatusChange: () => void
}

interface MaintenanceInfo {
  is_enabled: boolean
  enabled_at: string | null
  enabled_by: string | null
  disabled_at: string | null
  notes: string | null
}

export default function MaintenanceStatus({ onStatusChange }: MaintenanceStatusProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState<MaintenanceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/maintenance/status')
      
      if (response.ok) {
        const data = await response.json()
        // API returns { maintenance_mode: {...} }, extract the nested object
        setStatus(data.maintenance_mode)
      }
    } catch (error) {
      console.error('Error loading maintenance status:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(enable: boolean) {
    if (enable && !confirm('Enable maintenance mode? Users will see the maintenance page.')) {
      return
    }

    if (!enable && !confirm('Disable maintenance mode? Site will return to normal operation.')) {
      return
    }

    try {
      setToggling(true)
      const endpoint = enable
        ? '/api/admin/maintenance/enable'
        : '/api/admin/maintenance/disable'

      const response = await fetch(endpoint, { method: 'POST' })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to toggle maintenance mode')
      }

      toast({
        title: 'Success',
        description: `Maintenance mode ${enable ? 'enabled' : 'disabled'}`,
      })

      await loadStatus()
      onStatusChange()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
        </div>
      </Card>
    )
  }

  const isActive = status?.is_enabled || false

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6 space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Current Status</h2>
        <Badge
          variant={isActive ? 'destructive' : 'outline'}
          className={isActive ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-green-500/20 text-green-300 border-green-500/30'}
        >
          {isActive ? 'MAINTENANCE MODE' : 'OPERATIONAL'}
        </Badge>
      </div>

      {/* Status Icon & Message */}
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        {isActive ? (
          <>
            <AlertCircle className="h-20 w-20 text-orange-400" />
            <div className="text-center">
              <p className="text-lg font-medium text-orange-300">
                Maintenance Mode Active
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Users are currently seeing the maintenance page
              </p>
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="h-20 w-20 text-green-400" />
            <div className="text-center">
              <p className="text-lg font-medium text-green-300">
                System Operational
              </p>
              <p className="text-sm text-slate-400 mt-1">
                All services are running normally
              </p>
            </div>
          </>
        )}
      </div>

      {/* Active Maintenance Details */}
      {isActive && status && (
        <div className="border border-slate-700 rounded-lg p-4 space-y-3 bg-slate-900/50">
          <h3 className="text-sm font-semibold text-slate-300">Maintenance Details</h3>
          
          {status.notes && (
            <div>
              <p className="text-xs text-slate-500">Notes:</p>
              <p className="text-sm text-slate-300">{status.notes}</p>
            </div>
          )}

          {status.enabled_at && (
            <div>
              <p className="text-xs text-slate-500">Enabled At:</p>
              <p className="text-sm text-slate-300">
                {new Date(status.enabled_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Control Buttons */}
      <div className="space-y-2 pt-4 border-t border-slate-700">
        {isActive ? (
          <Button
            onClick={() => handleToggle(false)}
            disabled={toggling}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {toggling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Disabling...
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-2" />
                Disable Maintenance Mode
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => handleToggle(true)}
            disabled={toggling}
            variant="destructive"
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {toggling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enabling...
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                Enable Maintenance Mode
              </>
            )}
          </Button>
        )}

        <p className="text-xs text-slate-500 text-center pt-2">
          {isActive
            ? 'Disabling will restore normal site operation'
            : 'Enabling will show maintenance page to all users'}
        </p>
      </div>
    </Card>
  )
}
