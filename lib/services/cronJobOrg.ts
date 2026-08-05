/**
 * Typed client for the cron-job.org REST API.
 *
 * Base: https://api.cron-job.org
 * Auth: `Authorization: Bearer <CRONJOB_ORG_API_KEY>` (set as env var in Vercel)
 *
 * Docs: https://docs.cron-job.org/rest-api.html
 */

const CRONJOB_ORG_API_URL = 'https://api.cron-job.org'

export interface CronJobSchedule {
  timezone: string
  expiresAt: number
  hours: number[]
  mdays: number[]
  minutes: number[]
  months: number[]
  wdays: number[]
}

export interface CronJobAuth {
  enable: boolean
  user: string
  password: string
}

export interface CronJobExtendedData {
  headers: Record<string, string>
  body: string
}

export interface CronJob {
  jobId: number
  enabled: boolean
  title: string
  saveResponses: boolean
  url: string
  lastStatus: number
  lastDuration: number
  lastExecution: number
  sslCertExpiry?: number
  nextExecution: number | null
  type: number
  requestTimeout: number
  redirectSuccess: boolean
  folderId: number
  schedule: CronJobSchedule
  requestMethod: number
  auth?: CronJobAuth
  extendedData?: CronJobExtendedData
}

export interface CronJobHistoryItem {
  jobLogId: number
  jobId: number
  identifier: string
  date: number
  datePlanned: number
  jitter: number
  url: string
  duration: number
  status: number
  statusText: string
  httpStatus: number | null
  headers: string | null
  body: string | null
}

export const JOB_STATUS_LABELS: Record<number, string> = {
  0: 'Unknown',
  1: 'OK',
  2: 'Failed (DNS error)',
  3: 'Failed (could not connect to host)',
  4: 'Failed (HTTP error)',
  5: 'Failed (timeout)',
  6: 'Failed (too much response data)',
  7: 'Failed (invalid URL)',
  8: 'Failed (internal errors)',
  9: 'Failed (unknown reason)',
}

export const REQUEST_METHODS: Record<number, string> = {
  0: 'GET',
  1: 'POST',
  2: 'OPTIONS',
  3: 'HEAD',
  4: 'PUT',
  5: 'DELETE',
  6: 'TRACE',
  7: 'CONNECT',
  8: 'PATCH',
}

export class CronJobOrgError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.name = 'CronJobOrgError'
    this.status = status
  }
}

function getApiKey(): string {
  const key = process.env.CRONJOB_ORG_API_KEY
  if (!key) {
    throw new CronJobOrgError(
      'CRONJOB_ORG_API_KEY is not configured. Add it as an environment variable in Vercel.',
      503
    )
  }
  return key
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${CRONJOB_ORG_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
      ...(init?.headers || {}),
    },
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    let message = `cron-job.org API error (${response.status})`
    try {
      const body = await response.json()
      if (body?.error) message = body.error
    } catch {
      // ignore parse errors
    }
    throw new CronJobOrgError(message, response.status)
  }

  return response.json() as Promise<T>
}

/** GET /jobs — list all jobs in the account. */
export async function listCronJobs(): Promise<{ jobs: CronJob[]; someFailed: boolean }> {
  return request('/jobs')
}

/** GET /jobs/<jobId> — detailed info for one job. */
export async function getCronJob(jobId: number): Promise<CronJob> {
  const data = await request<{ jobDetails: CronJob }>(`/jobs/${jobId}`)
  return data.jobDetails
}

/** PATCH /jobs/<jobId> — update a subset of fields (e.g. `{ enabled: true }`). */
export async function updateCronJob(jobId: number, delta: Record<string, unknown>): Promise<void> {
  await request(`/jobs/${jobId}`, {
    method: 'PATCH',
    body: JSON.stringify({ job: delta }),
  })
}

/** GET /jobs/<jobId>/history — recent executions. */
export async function getCronJobHistory(
  jobId: number
): Promise<{ history: CronJobHistoryItem[]; predictions: number[] }> {
  return request(`/jobs/${jobId}/history`)
}

/**
 * Convert a cron-job.org JobSchedule into a classic 5-field cron expression.
 * e.g. minutes [0,15,30,45] with every-hour/every-day wildcards becomes "slash-15 * * * *".
 */
export function formatSchedule(schedule: CronJobSchedule | null): string {
  if (!schedule) return 'N/A'
  return [
    formatField(schedule.minutes),
    formatField(schedule.hours),
    formatField(schedule.mdays),
    formatField(schedule.months),
    formatField(schedule.wdays),
  ].join(' ')
}

function formatField(values: number[] | undefined): string {
  if (!values || values.length === 0) return '*'
  if (values.length === 1 && values[0] === -1) return '*'

  const step = detectStep(values)
  if (step !== null && step > 1) {
    return `*/${step}`
  }

  return values.join(',')
}

/** Detect a regular interval (e.g. 0,15,30,45 -> 15). Returns null if irregular. */
function detectStep(values: number[]): number | null {
  if (values.length < 2) return null
  const sorted = [...values].sort((a, b) => a - b)
  const step = sorted[1] - sorted[0]
  if (step <= 0) return null
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] !== step) return null
  }
  return step
}

/** Human-readable status label for a JobStatus value. */
export function jobStatusLabel(status: number): string {
  return JOB_STATUS_LABELS[status] || `Unknown (${status})`
}

/** True when a JobStatus value represents a failure. */
export function isJobStatusFailure(status: number): boolean {
  return status >= 2 && status <= 9
}
