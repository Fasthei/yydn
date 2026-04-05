const BASE = process.env.NEXT_PUBLIC_KB_API_BASE ?? ""

// ─── Error ───────────────────────────────────────────────
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers["Content-Type"] = "application/json"

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error")
    throw new ApiError(res.status, text)
  }
  return res.json()
}

// ─── Types ───────────────────────────────────────────────
export interface ThreadInfo {
  thread_id: string
  title: string
  created_at: number
  deleted: boolean
  metadata: Record<string, unknown>
}

export interface BackendMessage {
  id: string
  type: "human" | "ai"
  content: string
}

export interface BackendSource {
  id: string
  type: "web" | "kb" | "internal"
  title: string
  snippet: string
  score: number
  url?: string
  domain?: string
  category?: string
  tags?: string[]
}

export interface SearchStep {
  step: string
  status: "completed" | "pending"
  detail: string
}

export interface SearchResponse {
  sources: BackendSource[]
  steps: SearchStep[]
  depth: string
  total: number
}

export interface VersionInfo {
  id: string
  timestamp: number
  label: string
  content: string
}

export interface DocumentResponse {
  doc_id: string
  title: string
  content: string
  versions: VersionInfo[]
}

export interface SandboxStepBackend {
  id: string
  name: string
  status: string
  duration?: string
  logs?: string[]
  code?: string
  output?: string
}

export interface SandboxResponse {
  run_id: string
  status: string
  steps: SandboxStepBackend[]
}

export interface BranchInfo {
  id: string
  name: string
  from_message_id: string
  created_at: number
}

// ─── Threads ─────────────────────────────────────────────
export function createThread() {
  return request<ThreadInfo>("POST", "/threads")
}

export function listThreads() {
  return request<ThreadInfo[]>("GET", "/threads")
}

export function deleteThread(threadId: string) {
  return request<{ ok: boolean }>("DELETE", `/threads/${threadId}`)
}

export function renameThread(threadId: string, title: string) {
  return request<{ thread_id: string; title: string }>("PATCH", `/threads/${threadId}`, { title })
}

export function getMessages(threadId: string) {
  return request<BackendMessage[]>("GET", `/threads/${threadId}/messages`)
}

export function clearThread(threadId: string) {
  return request<{ ok: boolean }>("POST", `/threads/${threadId}/clear`)
}

// ─── Search ──────────────────────────────────────────────
export function searchKB(query: string, depth?: "quick" | "deep", top?: number) {
  return request<SearchResponse>("POST", "/search", { query, depth: depth ?? "quick", top: top ?? 8 })
}

// ─── Documents ───────────────────────────────────────────
export function generateDocument(prompt: string, title?: string, threadId?: string) {
  return request<DocumentResponse>("POST", "/documents/generate", {
    prompt,
    title,
    thread_id: threadId,
  })
}

export function getDocumentVersions(docId: string) {
  return request<{ doc_id: string; versions: VersionInfo[] }>("GET", `/documents/${docId}/versions`)
}

export function saveDocument(docId: string, content: string, label?: string) {
  return request<{ ok: boolean; version: VersionInfo }>("PATCH", `/documents/${docId}/save`, {
    content,
    label,
  })
}

// ─── Sandbox ─────────────────────────────────────────────
export function runSandbox(code?: string, ticketIds?: string[], threadId?: string) {
  return request<SandboxResponse>("POST", "/sandbox/run", {
    code,
    ticket_ids: ticketIds,
    thread_id: threadId,
  })
}

// ─── Tickets ─────────────────────────────────────────────
export function listTickets(page = 1, pageSize = 20) {
  return request<{ tickets: Record<string, unknown>[]; [key: string]: unknown }>(
    "GET",
    `/integrations/tickets?page=${page}&pageSize=${pageSize}`,
  )
}

export function getTicket(ticketId: string) {
  return request<Record<string, unknown>>("GET", `/integrations/tickets/${ticketId}`)
}

// ─── Branches ────────────────────────────────────────────
export function listBranches(threadId: string) {
  return request<BranchInfo[]>("GET", `/threads/${threadId}/branches`)
}

export function createBranch(threadId: string, fromMessageId: string, name?: string) {
  return request<BranchInfo>("POST", `/threads/${threadId}/branches`, {
    from_message_id: fromMessageId,
    name,
  })
}

// ─── Checkpoints ────────────────────────────────────────
export interface CheckpointInfo {
  id: string
  name: string
  state: Record<string, unknown>
  created_at: number
}

export function listCheckpoints(runId: string) {
  return request<CheckpointInfo[]>("GET", `/runs/${runId}/checkpoints`)
}

export function replayCheckpoint(runId: string, checkpointId: string) {
  return request<{ ok: boolean; checkpoint: CheckpointInfo }>("POST", `/runs/${runId}/replay`, {
    checkpoint_id: checkpointId,
  })
}

// ─── Runs ────────────────────────────────────────────────
export function interruptRun(runId: string, action: "approve" | "reject" | "resume", note?: string) {
  return request<{ ok: boolean }>("POST", `/runs/${runId}/interrupt`, { action, note })
}

// ─── Health ──────────────────────────────────────────────
export function checkHealth() {
  return request<{ status: string; service: string }>("GET", "/health")
}
