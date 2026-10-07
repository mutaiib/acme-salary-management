export interface FieldError {
  field: string
  cause: string
}

/** The API refused the request, or did not respond. */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldError[]

  constructor(status: number, message: string, fieldErrors: FieldError[] = []) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

/** Makes an `ApiError` from a failure of any kind, so that a screen handles one type. */
export function toApiError(cause: unknown): ApiError {
  return cause instanceof ApiError ? cause : new ApiError(0, String(cause))
}

type Params = Record<string, string | number | undefined>

function withParams(path: string, params: Params = {}): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value))
    }
  }
  const text = query.toString()
  return text ? `${path}?${text}` : path
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, init)
  } catch {
    throw new ApiError(0, 'The server did not respond.')
  }
  if (response.ok) {
    return (await response.json()) as T
  }
  const body = await response.json().catch(() => ({}))
  if (Array.isArray(body.detail)) {
    const fieldErrors = body.detail as FieldError[]
    throw new ApiError(response.status, fieldErrors[0]?.cause ?? 'The request failed.', fieldErrors)
  }
  throw new ApiError(response.status, body.detail ?? 'The request failed.')
}

export function getJson<T>(path: string, params?: Params): Promise<T> {
  return request<T>(withParams(path, params))
}

export function sendJson<T>(method: 'POST' | 'PUT', path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}
