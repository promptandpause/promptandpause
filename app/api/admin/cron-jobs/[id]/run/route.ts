import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/services/adminAuth'
import {
  getCronJob,
  REQUEST_METHODS,
  CronJobOrgError,
} from '@/lib/services/cronJobOrg'

/**
 * Manually execute a cron job right now.
 *
 * cron-job.org has no "trigger now" endpoint, so this performs a single
 * HTTP request to the job's URL using the credentials and headers stored
 * on the job. The execution is not recorded in cron-job.org history.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const job = await getCronJob(jobId)
    const method = REQUEST_METHODS[job.requestMethod] || 'GET'

    const headers: Record<string, string> = {}
    if (job.extendedData?.headers) {
      Object.assign(headers, job.extendedData.headers)
    }
    if (job.auth?.enable) {
      const basic = Buffer.from(`${job.auth.user}:${job.auth.password}`).toString('base64')
      headers.Authorization = `Basic ${basic}`
    }

    const startTime = Date.now()
    let response: Response
    try {
      response = await fetch(job.url, {
        method,
        headers,
        body: method === 'GET' || method === 'HEAD' ? undefined : (job.extendedData?.body || undefined),
      })
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
        duration: Date.now() - startTime,
      }, { status: 502 })
    }

    return NextResponse.json({
      success: response.ok,
      httpStatus: response.status,
      statusText: response.statusText,
      duration: Date.now() - startTime,
    })
  } catch (error) {
    if (error instanceof CronJobOrgError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: 'Failed to run cron job' }, { status: 500 })
  }
}
