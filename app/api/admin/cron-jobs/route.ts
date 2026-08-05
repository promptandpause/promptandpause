import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/services/adminAuth'
import { listCronJobs, CronJobOrgError } from '@/lib/services/cronJobOrg'

export async function GET() {
  try {
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobs, someFailed } = await listCronJobs()

    return NextResponse.json({
      success: true,
      jobs,
      someFailed,
    })
  } catch (error) {
    if (error instanceof CronJobOrgError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Failed to fetch cron jobs' }, { status: 500 })
  }
}
