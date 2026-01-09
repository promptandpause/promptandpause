'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Calendar, Clock, Trash2, Plus, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ScheduledMaintenanceProps {
  onScheduleChange: () => void
}

interface MaintenanceWindow {
  id: string
  scheduled_date: string
  start_time: string
  end_time: string
  affected_services: string[]
  description: string | null
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  created_at: string
}

const COMMON_SERVICES = ['Database', 'API', 'Web App', 'Email', 'Storage', 'Authentication']

export default function ScheduledMaintenance({ onScheduleChange }: ScheduledMaintenanceProps) {
  const { toast } = useToast()
  const [windows, setWindows] = useState<MaintenanceWindow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [scheduledDate, setScheduledDate] = useState('')
  const [startTime, setStartTime] = useState('02:00')
  const [endTime, setEndTime] = useState('06:00')
  const [description, setDescription] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  useEffect(() => {
    loadWindows()
  }, [])

  async function loadWindows() {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/maintenance?status=scheduled')
      
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to load scheduled maintenance')
      }

      const data = await response.json()
      setWindows(data.maintenance_windows || [])
    } catch (error: any) {
      setWindows([])
      setError(error?.message || 'Failed to load scheduled maintenance')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!scheduledDate || !startTime || !endTime || selectedServices.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      })
      return
    }

    // Validate weekend
    const date = new Date(scheduledDate)
    const dayOfWeek = date.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      toast({
        title: 'Invalid Date',
        description: 'Maintenance windows can only be scheduled on weekends (Saturday or Sunday)',
        variant: 'destructive',
      })
      return
    }

    try {
      setCreating(true)
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_date: scheduledDate,
          start_time: startTime,
          end_time: endTime,
          affected_services: selectedServices,
          description: description || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create maintenance window')
      }

      toast({
        title: 'Success',
        description: 'Maintenance window scheduled successfully',
      })

      // Reset form
      setScheduledDate('')
      setStartTime('02:00')
      setEndTime('06:00')
      setDescription('')
      setSelectedServices([])
      setShowCreateForm(false)

      await loadWindows()
      onScheduleChange()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [windowToCancel, setWindowToCancel] = useState<string | null>(null)

  async function handleCancel(windowId: string) {
    setWindowToCancel(windowId)
    setCancelConfirmOpen(true)
  }

  async function confirmCancel() {
    if (!windowToCancel) return

    try {
      const response = await fetch(`/api/admin/maintenance/${windowToCancel}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to cancel')
      }

      toast({
        title: 'Success',
        description: 'Maintenance window cancelled',
      })

      await loadWindows()
      onScheduleChange()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to cancel maintenance window',
        variant: 'destructive',
      })
    } finally {
      setCancelConfirmOpen(false)
      setWindowToCancel(null)
    }
  }

  function toggleService(service: string) {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    )
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

  return (
    <Card className="bg-white border-neutral-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-neutral-900">Scheduled Maintenance</h2>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Schedule New
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="border border-neutral-200 rounded-lg p-4 space-y-4 bg-neutral-50">
          <h3 className="text-sm font-semibold text-neutral-900">Schedule New Maintenance</h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-neutral-600 text-xs">Date (Weekend Only)</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="bg-white border-neutral-200 text-neutral-900"
              />
            </div>
            <div>
              <Label className="text-neutral-600 text-xs">Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-white border-neutral-200 text-neutral-900"
              />
            </div>
            <div>
              <Label className="text-neutral-600 text-xs">End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-white border-neutral-200 text-neutral-900"
              />
            </div>
          </div>

          <div>
            <Label className="text-neutral-600 text-xs mb-2">Affected Services</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_SERVICES.map((service) => (
                <Badge
                  key={service}
                  onClick={() => toggleService(service)}
                  className={`cursor-pointer ${
                    selectedServices.includes(service)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-neutral-700 border-neutral-200'
                  }`}
                  variant="outline"
                >
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-neutral-600 text-xs">Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white border-neutral-200 text-neutral-900"
              rows={2}
              placeholder="Brief description of the maintenance work..."
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Maintenance
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowCreateForm(false)}
              variant="outline"
              className="border-neutral-200 bg-white text-neutral-900"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Scheduled Windows List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {windows.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-neutral-400" />
            <p>No scheduled maintenance windows</p>
          </div>
        ) : (
          windows.map((window) => (
            <div
              key={window.id}
              className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-neutral-900">
                      {new Date(window.scheduled_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-neutral-500" />
                    <p className="text-sm text-neutral-700">
                      {window.start_time} - {window.end_time}
                    </p>
                  </div>

                  {window.description && (
                    <p className="text-sm text-neutral-600 mb-2">{window.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {window.affected_services.map((service) => (
                      <Badge
                        key={service}
                        variant="outline"
                        className="text-xs bg-neutral-50 border-neutral-200 text-neutral-700"
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <AlertDialog open={cancelConfirmOpen && windowToCancel === window.id} onOpenChange={(open) => !open && setCancelConfirmOpen(false)}>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancel(window.id)}
                      className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white border-neutral-200">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-neutral-900">Cancel Maintenance Window</AlertDialogTitle>
                      <AlertDialogDescription className="text-neutral-500">
                        Are you sure you want to cancel this scheduled maintenance window?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-white text-neutral-900 border-neutral-200">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={confirmCancel} className="bg-red-600 hover:bg-red-700">
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
