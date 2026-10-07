import { vi } from 'vitest'

type Reply = unknown | ((url: URL) => unknown)

/**
 * Replaces `fetch` with a stub. Each key is a path; the value is the JSON reply.
 * A path that is not in the map fails the request, as a server that is down does.
 */
export function stubApi(replies: Record<string, Reply>) {
  const fetchStub = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost')
    if (!(url.pathname in replies)) {
      throw new TypeError('Failed to fetch')
    }
    const reply = replies[url.pathname]
    const body = typeof reply === 'function' ? reply(url) : reply
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fetchStub)
  return fetchStub
}
