'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/maintenance/status')

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to fetch maintenance status')
      }

      const data = await response.json()
      // API returns { maintenance_mode: {...} }, extract the nested object
      setStatus(data.maintenance_mode)
    } catch (error: any) {
      setStatus(null)
      setError(error?.message || 'Failed to fetch maintenance status')
    } finally {
      setLoading(false)
    }
  }

  const [enableConfirmOpen, setEnableConfirmOpen] = useState(false)
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false)

  async function handleToggle(enable: boolean) {
    if (enable) {
      setEnableConfirmOpen(true)
    } else {
      setDisableConfirmOpen(true)
    }
  }

  async function confirmToggle(enable: boolean) {
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
      setEnableConfirmOpen(false)
      setDisableConfirmOpen(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-white border-neutral-200 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-neutral-500 animate-spin" />
        </div>
      </Card>
    )
  }

  const isActive = status?.is_enabled || false

  return (
    <Card className="bg-white border-neutral-200 p-6 space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">Current Status</h2>
        <Badge
          variant={isActive ? 'destructive' : 'outline'}
          className={
            isActive
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }
        >
          {isActive ? 'MAINTENANCE MODE' : 'OPERATIONAL'}
        </Badge>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Status Icon & Message */}
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        {isActive ? (
          <>
            <AlertCircle className="h-20 w-20 text-amber-600" />
            <div className="text-center">
              <p className="text-lg font-medium text-amber-800">
                Maintenance Mode Active
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                Users are currently seeing the maintenance page
              </p>
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="h-20 w-20 text-emerald-600" />
            <div className="text-center">
              <p className="text-lg font-medium text-emerald-800">
                System Operational
              </p>
              <p className="text-sm text-neutral-500 mt-1">
                All services are running normally
              </p>
            </div>
          </>
        )}
      </div>

      {/* Active Maintenance Details */}
      {isActive && status && (
        <div className="border border-neutral-200 rounded-lg p-4 space-y-3 bg-neutral-50">
          <h3 className="text-sm font-semibold text-neutral-900">Maintenance Details</h3>
          
          {status.notes && (
            <div>
              <p className="text-xs text-neutral-500">Notes:</p>
              <p className="text-sm text-neutral-700">{status.notes}</p>
            </div>
          )}

          {status.enabled_at && (
            <div>
              <p className="text-xs text-neutral-500">Enabled At:</p>
              <p className="text-sm text-neutral-700">
                {new Date(status.enabled_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Control Buttons */}
      <div className="space-y-2 pt-4 border-t border-neutral-200">
        {isActive ? (
          <AlertDialog open={disableConfirmOpen} onOpenChange={setDisableConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button
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
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white border-neutral-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-neutral-900">Disable Maintenance Mode</AlertDialogTitle>
                <AlertDialogDescription className="text-neutral-500">
                  Are you sure? Site will return to normal operation.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white text-neutral-900 border-neutral-200">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => confirmToggle(false)} className="bg-green-600 hover:bg-green-700">
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <AlertDialog open={enableConfirmOpen} onOpenChange={setEnableConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button
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
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white border-neutral-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-neutral-900">Enable Maintenance Mode</AlertDialogTitle>
                <AlertDialogDescription className="text-neutral-500">
                  Are you sure? Users will see the maintenance page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white text-neutral-900 border-neutral-200">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => confirmToggle(true)} className="bg-orange-600 hover:bg-orange-700">
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <p className="text-xs text-neutral-500 text-center pt-2">
          {isActive
            ? 'Disabling will restore normal site operation'
            : 'Enabling will show maintenance page to all users'}
        </p>
      </div>
    </Card>
  )
}
