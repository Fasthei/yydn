import type { BackendSource } from "./api-client"

const BASE = process.env.NEXT_PUBLIC_KB_API_BASE ?? ""

// ─── Callback types ──────────────────────────────────────
export interface SSECallbacks {
  onMetadata?: (data: { run_id: string; thread_id: string; assistant_id: string }) => void
  onToken?: (data: { id: string; text: string }) => void
  onSources?: (sources: BackendSource[]) => void
  onToolStatus?: (data: { name: string; status: string; step: string }) => void
  onInterrupt?: (data: {
    kind: string
    title: string
    description: string
    options: string[]
    run_id: string
  }) => void
  onReasoning?: (data: { summary: string; detail: string }) => void
  onError?: (data: { message: string }) => void
  onValues?: (data: {
    messages: Array<{
      id: string
      type: string
      content: string
      additional_kwargs?: Record<string, unknown>
    }>
  }) => void
  onEnd?: () => void
  onConnectionError?: (error: Error) => void
}

// ─── SSE parser ──────────────────────────────────────────
function parseSSEEvents(chunk: string): Array<{ event: string; data: string }> {
  const events: Array<{ event: string; data: string }> = []
  const blocks = chunk.split("\n\n")

  for (const block of blocks) {
    if (!block.trim()) continue
    let eventType = "message"
    let dataLine = ""

    for (const line of block.split("\n")) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7).trim()
      } else if (line.startsWith("data: ")) {
        dataLine += line.slice(6)
      } else if (line.startsWith("data:")) {
        dataLine += line.slice(5)
      }
    }

    if (dataLine) {
      events.push({ event: eventType, data: dataLine })
    }
  }

  return events
}

function dispatchEvent(event: { event: string; data: string }, callbacks: SSECallbacks) {
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(event.data)
  } catch {
    return
  }

  switch (event.event) {
    case "metadata":
      callbacks.onMetadata?.(parsed as Parameters<NonNullable<SSECallbacks["onMetadata"]>>[0])
      break

    case "updates": {
      const evt = parsed.event as string
      if (evt === "sources") {
        callbacks.onSources?.(parsed.sources as BackendSource[])
      } else if (evt === "tool_status") {
        callbacks.onToolStatus?.(parsed as Parameters<NonNullable<SSECallbacks["onToolStatus"]>>[0])
      } else if (evt === "interrupt") {
        callbacks.onInterrupt?.(parsed as Parameters<NonNullable<SSECallbacks["onInterrupt"]>>[0])
      } else if (evt === "reasoning") {
        callbacks.onReasoning?.(parsed as Parameters<NonNullable<SSECallbacks["onReasoning"]>>[0])
      } else if (evt === "error") {
        callbacks.onError?.(parsed as Parameters<NonNullable<SSECallbacks["onError"]>>[0])
      }
      break
    }

    case "messages": {
      const content = parsed.content as Array<{ type: string; text: string }> | undefined
      const text = content?.map((c) => c.text).join("") ?? ""
      callbacks.onToken?.({ id: parsed.id as string, text })
      break
    }

    case "values":
      callbacks.onValues?.(parsed as Parameters<NonNullable<SSECallbacks["onValues"]>>[0])
      break

    case "end":
      callbacks.onEnd?.()
      break
  }
}

// ─── Stream chat ─────────────────────────────────────────
export function streamChat(
  threadId: string,
  prompt: string,
  options: {
    ticketIds?: string[]
    callbacks: SSECallbacks
  },
): { abort: () => void } {
  const controller = new AbortController()

  const body = {
    input: {
      messages: [{ content: prompt }],
    },
    metadata: {
      ticket_ids: options.ticketIds ?? [],
    },
  }

  const run = async () => {
    try {
      const res = await fetch(`${BASE}/threads/${threadId}/runs/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "Stream request failed")
        throw new Error(`HTTP ${res.status}: ${text}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          // Process any remaining data in buffer
          if (buffer.trim()) {
            const events = parseSSEEvents(buffer)
            for (const event of events) {
              dispatchEvent(event, options.callbacks)
            }
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // Split on double newline to find complete events
        const parts = buffer.split("\n\n")
        // Keep the last part (potentially incomplete) in buffer
        buffer = parts.pop() ?? ""

        // Process complete events
        const completeChunk = parts.join("\n\n")
        if (completeChunk.trim()) {
          const events = parseSSEEvents(completeChunk)
          for (const event of events) {
            dispatchEvent(event, options.callbacks)
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return
      options.callbacks.onConnectionError?.(err as Error)
    }
  }

  run()

  return { abort: () => controller.abort() }
}
