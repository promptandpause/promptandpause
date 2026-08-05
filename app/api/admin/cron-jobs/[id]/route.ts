import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/services/adminAuth'
import { updateCronJob, CronJobOrgError } from '@/lib/services/cronJobOrg'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const jobId = parseInt(id, 10)
    if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid job id' }, { status: 400 })
    }

    const body = await request.json()
    const delta: Record<string, unknown> = {}

    if (typeof body.enabled === 'boolean') delta.enabled = body.enabled
    if (typeof body.title === 'string') delta.title = body.title
    if (typeof body.saveResponses === 'boolean') delta.saveResponses = body.saveResponses
    if (typeof body.redirectSuccess === 'boolean') delta.redirectSuccess = body.redirectSuccess
    if (typeof body.requestTimeout === 'number') delta.requestTimeout = body.requestTimeout

    if (Object.keys(delta).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
    }

    await updateCronJob(jobId, delta)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof CronJobOrgError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Failed to update cron job' }, { status: 500 })
  }
}
