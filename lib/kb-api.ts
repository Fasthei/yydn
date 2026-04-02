/**
 * 运营大脑 KB 后端（kb-chat-python-service）根路径。
 * 与 FastAPI 路由一致（同时支持 /api/kb-chat 前缀）。
 */
export function getKbApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_KB_API_BASE || ""
  return raw.replace(/\/$/, "")
}

export function kbUrl(path: string): string {
  const base = getKbApiBase()
  const p = path.startsWith("/") ? path : `/${path}`
  if (!base) return p
  return `${base}${p}`
}

/** SSE: POST /threads/:id/runs/stream or /api/kb-chat/threads/:id/runs/stream */
export function streamThreadUrl(threadId: string): string {
  return kbUrl(`/threads/${threadId}/runs/stream`)
}
