function jsmDisabledError(): Error {
  return new Error('Jira Service Management integration is disabled')
}

export type JsmCreateRequestParams = {
  serviceDeskId: string
  requestTypeId: string
  summary: string
  description: string
  raiseOnBehalfOf?: string
  fields?: Record<string, any>
}

export type JsmCreateRequestResult = {
  requestId: string
  issueId?: string
  issueKey?: string
  self?: string
  web?: string
}

export type JsmServiceDesk = {
  id: string
  name: string
  projectId?: string
  projectKey?: string
}

export type JsmRequestType = {
  id: string
  name: string
  description?: string
}

export async function createJsmRequest(params: JsmCreateRequestParams): Promise<JsmCreateRequestResult> {
  throw jsmDisabledError()
}

export async function listJsmServiceDesks(): Promise<JsmServiceDesk[]> {
  throw jsmDisabledError()
}

export async function listJsmRequestTypes(serviceDeskId: string): Promise<JsmRequestType[]> {
  throw jsmDisabledError()
}
