'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Settings } from 'lucide-react'
import MaintenanceStatus from './components/MaintenanceStatus'
import ScheduledMaintenance from './components/ScheduledMaintenance'
import MaintenanceHistory from './components/MaintenanceHistory'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function MaintenancePage() {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Check for active maintenance on load
  useEffect(() => {
    checkActiveMaintenance()
  }, [refreshKey])

  async function checkActiveMaintenance() {
    try {
      setError(null)
      const response = await fetch('/api/admin/maintenance/status')
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to fetch maintenance status')
      }

      const data = await response.json()
      setMaintenanceEnabled(Boolean(data?.maintenance_mode?.is_enabled))
    } catch (error: any) {
      setMaintenanceEnabled(false)
      setError(error?.message || 'Failed to fetch maintenance status')
    }
  }

  function handleStatusChange() {
    // Increment refresh key to reload all components
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Settings className="h-7 w-7 text-amber-600" />
          <h1 className="text-2xl font-semibold text-neutral-900">Maintenance Control</h1>
        </div>
        <p className="text-sm text-neutral-500">Manage system maintenance windows and scheduled downtime</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Active Status Banner */}
      {maintenanceEnabled && (
        <Card className="bg-amber-50 border-amber-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 bg-amber-600 rounded-full animate-pulse" />
            <div>
              <p className="text-amber-800 font-semibold">
                System is currently in maintenance mode
              </p>
              <p className="text-sm text-amber-700">
                Users are seeing the maintenance page
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left - Current Status (40%) */}
        <div className="col-span-5 overflow-y-auto">
          <MaintenanceStatus
            key={`status-${refreshKey}`}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Right - Scheduled & History (60%) */}
        <div className="col-span-7 overflow-y-auto">
          <Tabs defaultValue="scheduled" className="space-y-4">
            <TabsList className="bg-neutral-100 border border-neutral-200">
              <TabsTrigger value="scheduled">Scheduled Maintenance</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="scheduled">
              <ScheduledMaintenance
                key={`scheduled-${refreshKey}`}
                onScheduleChange={handleStatusChange}
              />
            </TabsContent>

            <TabsContent value="history">
              <MaintenanceHistory key={`history-${refreshKey}`} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
