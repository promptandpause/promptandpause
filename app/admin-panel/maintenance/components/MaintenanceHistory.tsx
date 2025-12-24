'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface MaintenanceWindow {
  id: string
  scheduled_date: string
  start_time: string
  end_time: string
  actual_start_time: string | null
  actual_end_time: string | null
  affected_services: string[]
  description: string | null
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  created_at: string
  completed_at: string | null
  cancelled_at: string | null
}

export default function MaintenanceHistory() {
  const [windows, setWindows] = useState<MaintenanceWindow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    try {
      setLoading(true)
      // Fetch completed and cancelled windows
      const [completedRes, cancelledRes] = await Promise.all([
        fetch('/api/admin/maintenance?status=completed'),
        fetch('/api/admin/maintenance?status=cancelled'),
      ])

      const completed = completedRes.ok ? await completedRes.json() : { maintenance_windows: [] }
      const cancelled = cancelledRes.ok ? await cancelledRes.json() : { maintenance_windows: [] }

      // Combine and sort by date (most recent first)
      const allWindows = [...completed.maintenance_windows, ...cancelled.maintenance_windows].sort(
        (a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
      )

      setWindows(allWindows)
    } catch (error) {
      console.error('Error loading maintenance history:', error)
    } finally {
      setLoading(false)
    }
  }

  function calculateDuration(startTime: string | null, endTime: string | null): string {
    if (!startTime || !endTime) return 'N/A'
    
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    const durationMinutes = endMinutes - startMinutes
    
    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60
    
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h`
    return `${minutes}m`
  }

  function getStatusBadge(status: string) {
    if (status === 'completed') {
      return (
        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      )
    }
    return (
      <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
        <XCircle className="h-3 w-3 mr-1" />
        Cancelled
      </Badge>
    )
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

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Maintenance History</h2>
        <Badge variant="outline" className="text-slate-400 border-slate-600">
          {windows.length} records
        </Badge>
      </div>

      {/* History List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {windows.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Clock className="h-12 w-12 mx-auto mb-2 text-slate-600" />
            <p>No maintenance history</p>
          </div>
        ) : (
          windows.map((window) => (
            <div
              key={window.id}
              className="border border-slate-700 rounded-lg p-4 hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <p className="text-sm font-medium text-white">
                    {new Date(window.scheduled_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {getStatusBadge(window.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Scheduled Time</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <p className="text-sm text-slate-300">
                      {window.start_time} - {window.end_time}
                    </p>
                  </div>
                </div>

                {window.status === 'completed' && window.actual_start_time && window.actual_end_time && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Actual Duration</p>
                    <p className="text-sm text-green-400">
                      {calculateDuration(window.actual_start_time, window.actual_end_time)}
                    </p>
                  </div>
                )}
              </div>

              {window.description && (
                <p className="text-sm text-slate-400 mb-3">{window.description}</p>
              )}

              {/* Affected Services */}
              <div className="flex flex-wrap gap-1">
                {window.affected_services.map((service) => (
                  <Badge
                    key={service}
                    variant="outline"
                    className="text-xs bg-slate-900 border-slate-600"
                  >
                    {service}
                  </Badge>
                ))}
              </div>

              {/* Completion/Cancellation Time */}
              {(window.completed_at || window.cancelled_at) && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-xs text-slate-500">
                    {window.status === 'completed' ? 'Completed' : 'Cancelled'} on{' '}
                    {new Date(
                      (window.completed_at || window.cancelled_at) as string
                    ).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
