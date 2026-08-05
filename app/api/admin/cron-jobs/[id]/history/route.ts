import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/services/adminAuth'
import { getCronJobHistory, CronJobOrgError } from '@/lib/services/cronJobOrg'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { history, predictions } = await getCronJobHistory(jobId)

    return NextResponse.json({
      success: true,
      history,
      predictions,
    })
  } catch (error) {
    if (error instanceof CronJobOrgError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Failed to fetch job history' }, { status: 500 })
  }
}
