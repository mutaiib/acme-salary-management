import { vi } from 'vitest'

interface Refusal {
  status: number
  body: unknown
}

type Reply = unknown | ((url: URL, body: unknown) => unknown)

/** A reply that the API refuses, for example `refuse(422, [{ field, cause }])`. */
export function refuse(status: number, detail: unknown): Refusal {
  return { status, body: { detail } }
}

function isRefusal(value: unknown): value is Refusal {
  return typeof value === 'object' && value !== null && 'status' in value && 'body' in value
}

/**
 * Replaces `fetch` with a stub. A key is a path (`/api/meta`) for a GET request,
 * or a method and a path (`POST /api/employees/1/deactivate`). The value is the JSON reply.
 * A request that is not in the map fails, as a server that is down does.
 */
export function stubApi(replies: Record<string, Reply>) {
  const fetchStub = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost')
    const method = init?.method ?? 'GET'
    const key = method === 'GET' ? url.pathname : `${method} ${url.pathname}`
    if (!(key in replies)) {
      throw new TypeError('Failed to fetch')
    }
    const reply = replies[key]
    const sent = init?.body ? JSON.parse(String(init.body)) : undefined
    // A reply function can be async, so that a test controls when the reply arrives.
    const result = await (typeof reply === 'function' ? reply(url, sent) : reply)
    const [status, body] = isRefusal(result) ? [result.status, result.body] : [200, result]
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fetchStub)
  return fetchStub
}

/** The requests that the screen sent to one path, oldest first. */
export function requestsTo(fetchStub: ReturnType<typeof stubApi>, path: string): URL[] {
  return fetchStub.mock.calls
    .map(([input]) => new URL(String(input), 'http://localhost'))
    .filter((url) => url.pathname === path)
}
