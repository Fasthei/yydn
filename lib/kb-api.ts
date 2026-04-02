/**
 * 运营大脑 KB 后端 API 客户端
 */

export function getKbApiBase(): string {
  if (typeof window !== "undefined") {
    return (process.env.NEXT_PUBLIC_KB_API_BASE ?? "").replace(/\/$/, "")
  }
  return ""
}

function kbUrl(path: string): string {
  const base = getKbApiBase()
  const p = path.startsWith("/") ? path : `/${path}`
  return base ? `${base}${p}` : p
}

export interface KbThread {
  thread_id: string
  title: string
  created_at: number
  deleted: boolean
  metadata: Record<string, unknown>
}

export interface KbSource {
  id: string
  type: "web" | "kb" | "internal"
  title: string
  snippet: string
  score: number
  url?: string
  domain?: string
  category?: string
  tags?: string
}

export async function createThread(): Promise<KbThread> {
  const r = await fetch(kbUrl("/threads"), { method: "POST" })
  if (!r.ok) throw new Error(`createThread: ${r.status}`)
  return r.json()
}

export async function listThreads(): Promise<KbThread[]> {
  const r = await fetch(kbUrl("/threads"))
  if (!r.ok) return []
  return r.json()
}

export async function renameThread(threadId: string, title: string): Promise<KbThread> {
  const r = await fetch(kbUrl(`/threads/${threadId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  })
  if (!r.ok) throw new Error(`renameThread: ${r.status}`)
  return r.json()
}

export async function deleteThread(threadId: string): Promise<void> {
  await fetch(kbUrl(`/threads/${threadId}`), { method: "DELETE" })
}

export interface KbSearchResult {
  sources: KbSource[]
  steps: { step: string; status: string; detail: string }[]
  depth: string
  total: number
}

export async function searchKb(query: string, top = 8): Promise<KbSearchResult> {
  const r = await fetch(kbUrl("/search"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, top, depth: "deep" }),
  })
  if (!r.ok) return { sources: [], steps: [], depth: "quick", total: 0 }
  return r.json()
}

export interface KbDocResult {
  doc_id: string
  title: string
  content: string
  versions: { id: string; timestamp: number; label: string }[]
}

export async function generateDocument(prompt: string, title?: string, threadId?: string): Promise<KbDocResult> {
  const r = await fetch(kbUrl("/documents/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, title, thread_id: threadId }),
  })
  if (!r.ok) throw new Error(`generateDocument: ${r.status}`)
  return r.json()
}

export async function saveDocument(docId: string, content: string, label?: string) {
  const r = await fetch(kbUrl(`/documents/${docId}/save`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, label }),
  })
  if (!r.ok) throw new Error(`saveDocument: ${r.status}`)
  return r.json()
}

export interface KbSandboxResult {
  run_id: string
  status: string
  steps: { id: string; name: string; status: string; duration?: string; logs?: string[]; code?: string; output?: string }[]
}

export async function runSandbox(ticketIds: string[], code?: string): Promise<KbSandboxResult> {
  const r = await fetch(kbUrl("/sandbox/run"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket_ids: ticketIds, code }),
  })
  if (!r.ok) throw new Error(`runSandbox: ${r.status}`)
  return r.json()
}

export async function listTickets(page = 1, pageSize = 20) {
  const r = await fetch(kbUrl(`/integrations/tickets?page=${page}&pageSize=${pageSize}`))
  if (!r.ok) return { tickets: [], total: 0 }
  return r.json()
}

export type SSEEvent =
  | { event: "metadata"; data: { run_id: string; thread_id: string; assistant_id: string } }
  | { event: "updates"; data: Record<string, unknown> }
  | { event: "messages"; data: { id: string; type: string; content: { type: string; text: string }[] } }
  | { event: "values"; data: { messages: Record<string, unknown>[] } }
  | { event: "end"; data: Record<string, unknown> }

export function streamChat(
  threadId: string,
  userMessage: string,
  opts?: { ticketIds?: string[] },
): {
  eventSource: AbortController
  events: AsyncGenerator<SSEEvent>
} {
  const ctrl = new AbortController()
  const url = kbUrl(`/threads/${threadId}/runs/stream`)

  async function* gen(): AsyncGenerator<SSEEvent> {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { messages: [{ content: userMessage }] },
        ticket_ids: opts?.ticketIds ?? [],
      }),
      signal: ctrl.signal,
    })

    if (!resp.ok || !resp.body) {
      yield { event: "end", data: { error: `HTTP ${resp.status}` } }
      return
    }

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const parts = buffer.split("\n\n")
      buffer = parts.pop() ?? ""

      for (const part of parts) {
        if (!part.trim()) continue
        let eventType = "message"
        let dataStr = ""
        for (const line of part.split("\n")) {
          if (line.startsWith("event: ")) eventType = line.slice(7).trim()
          else if (line.startsWith("data: ")) dataStr = line.slice(6)
        }
        if (!dataStr) continue
        try {
          const data = JSON.parse(dataStr)
          yield { event: eventType, data } as SSEEvent
        } catch {
          // skip invalid JSON
        }
      }
    }
  }

  return { eventSource: ctrl, events: gen() }
}
