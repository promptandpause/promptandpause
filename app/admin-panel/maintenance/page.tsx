'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Settings } from 'lucide-react'
import MaintenanceStatus from './components/MaintenanceStatus'
import ScheduledMaintenance from './components/ScheduledMaintenance'
import MaintenanceHistory from './components/MaintenanceHistory'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function MaintenancePage() {
  const [activeMaintenanceId, setActiveMaintenanceId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Check for active maintenance on load
  useEffect(() => {
    checkActiveMaintenance()
  }, [refreshKey])

  async function checkActiveMaintenance() {
    try {
      const response = await fetch('/api/admin/maintenance/status')
      if (response.ok) {
        const data = await response.json()
        setActiveMaintenanceId(data.maintenance_window_id || null)
      }
    } catch (error) {
      console.error('Error checking maintenance status:', error)
    }
  }

  function handleStatusChange() {
    // Increment refresh key to reload all components
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-orange-500" />
          <h1 className="text-3xl font-bold text-white">Maintenance Control</h1>
        </div>
        <p className="text-slate-400">
          Manage system maintenance windows and scheduled downtime
        </p>
      </div>

      {/* Active Status Banner */}
      {activeMaintenanceId && (
        <Card className="mb-6 bg-orange-500/10 border-orange-500/30 p-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 bg-orange-500 rounded-full animate-pulse" />
            <div>
              <p className="text-orange-300 font-semibold">
                System is currently in maintenance mode
              </p>
              <p className="text-sm text-orange-400/80">
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
            <TabsList className="bg-slate-800 border-slate-700">
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
