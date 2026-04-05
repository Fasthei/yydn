"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/chat/sidebar"
import { Header } from "@/components/chat/header"
import { ChatInput } from "@/components/chat/chat-input"
import { WelcomeArea } from "@/components/chat/welcome-area"
import { TicketPanel } from "@/components/chat/ticket-panel"
import { Message } from "@/components/chat/message"
import { SourcesPanel, type Source } from "@/components/chat/sources-panel"
import { SandboxPanel, type SandboxStep } from "@/components/chat/sandbox-panel"
import { DocumentWorkspace } from "@/components/chat/document-workspace"
import { ConversationBranch, type Branch, type Checkpoint } from "@/components/chat/conversation-branch"
import { ConnectionStatus, RejoinBanner, type ConnectionState } from "@/components/chat/connection-status"
import { ApprovalDialog, type ApprovalRequest } from "@/components/chat/approval-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  listThreads, createThread, deleteThread, renameThread,
  searchKB, generateDocument, saveDocument, runSandbox,
  listTickets, getMessages, interruptRun, checkHealth,
  type BackendSource,
} from "@/lib/api-client"
import { streamChat } from "@/lib/sse-client"

// Branches and checkpoints kept as mock (Phase 4)
const mockBranches: Branch[] = [
  { id: "branch-1", name: "主分支", chatId: "1", parentId: undefined, parentMessageId: undefined, createdAt: "2 小时前", isActive: true, messageCount: 5 },
  { id: "branch-2", name: "性能优化方案 A", chatId: "1", parentId: "branch-1", parentMessageId: "msg-3", createdAt: "1 小时前", isActive: false, messageCount: 3 },
  { id: "branch-3", name: "数据库索引讨论", chatId: "3", parentId: undefined, parentMessageId: undefined, createdAt: "3 小时前", isActive: true, messageCount: 4 },
]

const mockCheckpoints: Checkpoint[] = [
  { id: "cp-1", messageId: "msg-2", timestamp: "14:30", preview: "讨论了 API 超时的可能原因...", branchId: "branch-1" },
  { id: "cp-2", messageId: "msg-4", timestamp: "14:45", preview: "确定了优化方向...", branchId: "branch-1" },
]

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  toolUsed?: string
  ticketContext?: string[]
  sources?: Source[]
  hasBranch?: boolean
  branchCount?: number
}

// ─── Helpers ─────────────────────────────────────────────
function mapBackendSource(s: BackendSource): Source {
  return {
    id: s.id,
    type: s.type,
    title: s.title,
    snippet: s.snippet,
    score: s.score,
    url: s.url,
    domain: s.domain ?? s.category,
  }
}

function nowTs() {
  return new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
}

interface Ticket {
  id: string
  title: string
  description: string
  status: "open" | "pending" | "closed"
  priority: "high" | "medium" | "low"
  createdAt: string
  assignee?: string
}

function mapTicketStatus(s: string): "open" | "pending" | "closed" {
  const lower = (s ?? "").toLowerCase()
  if (lower.includes("close") || lower.includes("resolved") || lower.includes("done")) return "closed"
  if (lower.includes("pend") || lower.includes("progress") || lower.includes("assign")) return "pending"
  return "open"
}

function mapTicketPriority(p: string): "high" | "medium" | "low" {
  const lower = (p ?? "").toLowerCase()
  if (lower.includes("high") || lower.includes("urgent") || lower.includes("priority")) return "high"
  if (lower.includes("low")) return "low"
  return "medium"
}

// ─── Component ───────────────────────────────────────────
export default function ChatPage() {
  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showTicketPanel, setShowTicketPanel] = useState(false)
  const [showSourcesPanel, setShowSourcesPanel] = useState(false)
  const [showSandboxPanel, setShowSandboxPanel] = useState(false)
  const [showDocumentWorkspace, setShowDocumentWorkspace] = useState(false)
  const [sourcesExpanded, setSourcesExpanded] = useState(false)
  const [sandboxExpanded, setSandboxExpanded] = useState(false)
  const [documentExpanded, setDocumentExpanded] = useState(false)

  // Data State
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([])
  const [loadedTicketIds, setLoadedTicketIds] = useState<string[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | undefined>()
  const [currentBranchId, setCurrentBranchId] = useState<string>("branch-1")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [chats, setChats] = useState<{ id: string; title: string; branchCount?: number; isStarred?: boolean }[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])

  // Sources State
  const [currentSources, setCurrentSources] = useState<Source[]>([])
  const [searchSteps, setSearchSteps] = useState<{ step: string; status: "completed" | "in-progress" | "pending"; detail?: string }[]>([])
  const [searchDepth, setSearchDepth] = useState<"quick" | "deep">("quick")

  // Sandbox State
  const [sandboxStatus, setSandboxStatus] = useState<"idle" | "running" | "completed" | "error">("idle")
  const [sandboxSteps, setSandboxSteps] = useState<SandboxStep[]>([])

  // Document State
  const [documentTitle, setDocumentTitle] = useState("")
  const [documentContent, setDocumentContent] = useState("")
  const [documentVersions, setDocumentVersions] = useState<{ id: string; timestamp: string; label: string }[]>([])
  const [isDocumentGenerating, setIsDocumentGenerating] = useState(false)
  const [isDocumentSaving, setIsDocumentSaving] = useState(false)
  const [currentDocId, setCurrentDocId] = useState<string | null>(null)

  // Connection State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>("connected")
  const [showRejoinBanner, setShowRejoinBanner] = useState(false)
  const [missedMessages, setMissedMessages] = useState(0)

  // Approval State
  const [approvalRequest, setApprovalRequest] = useState<ApprovalRequest | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)

  // Run State
  const [currentRunId, setCurrentRunId] = useState<string | null>(null)
  const abortRef = useRef<(() => void) | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // ─── Load threads on mount ─────────────────────────────
  useEffect(() => {
    listThreads()
      .then((threads) => {
        setChats(
          threads
            .filter((t) => !t.deleted)
            .map((t) => ({ id: t.thread_id, title: t.title || "新对话", branchCount: 0 }))
        )
        setConnectionStatus("connected")
      })
      .catch((err) => {
        console.error("Failed to load threads:", err)
        setConnectionStatus("error")
      })
  }, [])

  // ─── Load tickets on mount ─────────────────────────────
  useEffect(() => {
    listTickets(1, 50)
      .then((data) => {
        const items = (data.tickets ?? data.items ?? []) as Record<string, unknown>[]
        setTickets(
          items.map((t) => ({
            id: String(t.id ?? t.ticketId ?? t.ticketNumber ?? ""),
            title: String(t.title ?? t.subject ?? t.description ?? "未命名工单"),
            description: String(t.description ?? t.content ?? ""),
            status: mapTicketStatus(String(t.status ?? "")),
            priority: mapTicketPriority(String(t.priority ?? "")),
            createdAt: String(t.createdAt ?? t.created_at ?? t.createdDate ?? ""),
            assignee: t.assignee ? String(t.assignee) : (t.assignedEngineerId ? String(t.assignedEngineerId) : undefined),
          }))
        )
      })
      .catch((err) => console.error("Failed to load tickets:", err))
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sidebarTickets = tickets.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    selected: loadedTicketIds.includes(t.id),
  }))

  const handleToggleTicket = (ticketId: string) => {
    setSelectedTicketIds((prev) =>
      prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]
    )
  }

  const handleConfirmTickets = () => {
    setLoadedTicketIds(selectedTicketIds)
    setShowTicketPanel(false)

    if (selectedTicketIds.length > 0) {
      const ticketTitles = selectedTicketIds
        .map((id) => tickets.find((t) => t.id === id)?.title)
        .filter(Boolean)
        .join("、")

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `已加载 ${selectedTicketIds.length} 个工单到当前对话：${ticketTitles}。\n\n现在你可以针对这些工单进行提问，我会基于工单内容为你提供帮助。`,
          timestamp: nowTs(),
          ticketContext: selectedTicketIds,
        },
      ])
    }
  }

  // ─── handleSend: core SSE integration ──────────────────
  const handleSend = useCallback(
    async (
      message: string,
      options: { searchMode: "quick" | "deep" | null; tool: "search" | "document" | "sandbox" | null }
    ) => {
      // Abort any previous stream
      abortRef.current?.()
      abortRef.current = null

      // Create thread if none selected
      let threadId = currentChatId
      let isNewThread = false
      if (!threadId) {
        try {
          const thread = await createThread()
          threadId = thread.thread_id
          const title = message.slice(0, 30) || "新对话"
          setChats((prev) => [{ id: threadId!, title, branchCount: 0 }, ...prev])
          setCurrentChatId(threadId)
          isNewThread = true
          // Rename on backend
          renameThread(threadId, title).catch(() => {})
        } catch (err) {
          console.error("Failed to create thread:", err)
          setConnectionStatus("error")
          return
        }
      } else {
        // Auto-rename if current title is "新���话" (first message in existing thread)
        const currentChat = chats.find((c) => c.id === threadId)
        if (currentChat?.title === "新对话" && message.trim()) {
          const newTitle = message.slice(0, 30)
          setChats((prev) => prev.map((c) => (c.id === threadId ? { ...c, title: newTitle } : c)))
          renameThread(threadId, newTitle).catch(() => {})
        }
      }

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: nowTs(),
        ticketContext: loadedTicketIds.length > 0 ? loadedTicketIds : undefined,
      }
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      // Auto-detect tool intent from message keywords when no tool explicitly selected
      let effectiveTool = options.tool
      let effectiveSearchMode = options.searchMode
      if (!effectiveTool) {
        const lower = message.toLowerCase()
        if (lower.includes("沙盒") || lower.includes("sandbox") || lower.includes("执行脚本") || lower.includes("诊断脚本")) {
          effectiveTool = "sandbox"
        } else if (lower.includes("生成文档") || lower.includes("文档摘要") || lower.includes("故障分析文档") || lower.includes("generate document")) {
          effectiveTool = "document"
        } else if (lower.includes("深度搜索") || lower.includes("deep search")) {
          effectiveTool = "search"
          effectiveSearchMode = "deep"
        }
      }

      // Handle tool-specific pre-calls
      if (effectiveTool === "search" && effectiveSearchMode === "deep") {
        setSearchDepth("deep")
        try {
          const res = await searchKB(message, "deep")
          setCurrentSources(res.sources.map(mapBackendSource))
          setSearchSteps(
            res.steps.map((s) => ({
              step: s.step,
              status: s.status === "completed" ? ("completed" as const) : ("pending" as const),
              detail: s.detail,
            }))
          )
          setShowSourcesPanel(true)
        } catch (err) {
          console.error("Search failed:", err)
        }
      } else if (effectiveTool === "sandbox") {
        setShowSandboxPanel(true)
        setSandboxStatus("running")
        setSandboxSteps([
          { id: "1", name: "初始化测试环境", status: "running" },
          { id: "2", name: "加载工单/上下文", status: "pending" },
          { id: "3", name: "执行诊断", status: "pending" },
        ])
        try {
          const res = await runSandbox(undefined, loadedTicketIds, threadId)
          setSandboxSteps(
            res.steps.map((s) => ({
              id: s.id,
              name: s.name,
              status: (s.status === "success" ? "success" : s.status === "failed" ? "error" : "success") as SandboxStep["status"],
              duration: s.duration,
              logs: s.logs,
              code: s.code,
              output: s.output,
            }))
          )
          setSandboxStatus("completed")
        } catch (err) {
          console.error("Sandbox failed:", err)
          setSandboxStatus("error")
        }
      } else if (effectiveTool === "document") {
        setShowDocumentWorkspace(true)
        setIsDocumentGenerating(true)
        try {
          const res = await generateDocument(message, undefined, threadId)
          setDocumentTitle(res.title)
          setDocumentContent(res.content)
          setCurrentDocId(res.doc_id)
          setDocumentVersions(
            res.versions.map((v) => ({
              id: v.id,
              timestamp: new Date(v.timestamp * 1000).toLocaleTimeString("zh-CN"),
              label: v.label,
            }))
          )
        } catch (err) {
          console.error("Document generation failed:", err)
        }
        setIsDocumentGenerating(false)
      }

      // Stream AI response via SSE
      const assistantMsgId = (Date.now() + 1).toString()
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          content: "",
          timestamp: nowTs(),
          toolUsed: effectiveTool === "search"
            ? (effectiveSearchMode === "deep" ? "深度搜索" : "快速搜索")
            : effectiveTool === "document"
            ? "文档生成"
            : effectiveTool === "sandbox"
            ? "沙盒执行"
            : undefined,
          ticketContext: loadedTicketIds.length > 0 ? loadedTicketIds : undefined,
        },
      ])

      const { abort } = streamChat(threadId, message, {
        ticketIds: loadedTicketIds.length > 0 ? loadedTicketIds : undefined,
        callbacks: {
          onMetadata: (data) => {
            setCurrentRunId(data.run_id)
            setConnectionStatus("connected")
          },
          onToken: (data) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: m.content + data.text } : m
              )
            )
          },
          onSources: (sources) => {
            const mapped = sources.map(mapBackendSource)
            // Only update if SSE returned results, or if no prior search results exist
            // This prevents SSE's internal KB search from overwriting explicit deep search results
            if (mapped.length > 0) {
              setCurrentSources((prev) => (prev.length > 0 ? [...prev, ...mapped.filter((s) => !prev.some((p) => p.id === s.id))] : mapped))
              setShowSourcesPanel(true)
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, sources: mapped } : m))
              )
            } else {
              // SSE returned empty sources — keep existing results if any, just show panel
              setCurrentSources((prev) => {
                if (prev.length > 0) setShowSourcesPanel(true)
                return prev
              })
            }
          },
          onToolStatus: (data) => {
            setSearchSteps((prev) => {
              const idx = prev.findIndex((s) => s.step === data.name)
              const newStep = {
                step: data.name,
                status: (data.status === "completed" ? "completed" : "in-progress") as "completed" | "in-progress" | "pending",
                detail: data.step,
              }
              if (idx >= 0) {
                return prev.map((s, i) => (i === idx ? newStep : s))
              }
              return [...prev, newStep]
            })
          },
          onInterrupt: (data) => {
            setApprovalRequest({
              id: data.run_id,
              type: "sensitive",
              title: data.title,
              description: data.description,
              timestamp: new Date().toISOString(),
            })
            setShowApprovalDialog(true)
          },
          onValues: (data) => {
            const finalMsg = data.messages.find((m) => m.type === "ai")
            if (finalMsg) {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, content: finalMsg.content } : m))
              )
            }
          },
          onEnd: () => {
            setIsLoading(false)
          },
          onError: (data) => {
            console.error("SSE error event:", data.message)
            setIsLoading(false)
          },
          onConnectionError: (err) => {
            console.error("SSE connection error:", err)
            setConnectionStatus("error")
            setIsLoading(false)
            // Update the placeholder message with error info
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId && m.content === ""
                  ? { ...m, content: "连接出错，请稍后重试。" }
                  : m
              )
            )
          },
        },
      })

      abortRef.current = abort
    },
    [currentChatId, loadedTicketIds, chats]
  )

  // ─── Thread operations ─────────────────────────────────
  const handleNewChat = useCallback(async () => {
    abortRef.current?.()
    abortRef.current = null
    setMessages([])
    setCurrentChatId(undefined)
    setLoadedTicketIds([])
    setSelectedTicketIds([])
    setShowSourcesPanel(false)
    setShowSandboxPanel(false)
    setShowDocumentWorkspace(false)
    setCurrentSources([])
    setSandboxSteps([])
    setDocumentContent("")
    setDocumentTitle("")
    setCurrentDocId(null)
    setCurrentRunId(null)
    setSearchSteps([])
    setIsLoading(false)
  }, [])

  const handleSelectChat = useCallback(async (chatId: string) => {
    abortRef.current?.()
    abortRef.current = null
    setCurrentChatId(chatId)
    setIsLoading(false)
    setShowSourcesPanel(false)
    setShowSandboxPanel(false)
    setShowDocumentWorkspace(false)
    setCurrentSources([])
    setSandboxSteps([])
    setSearchSteps([])

    // Load messages from backend
    try {
      const msgs = await getMessages(chatId)
      setMessages(
        msgs.map((m) => ({
          id: m.id,
          role: m.type === "human" ? "user" : "assistant",
          content: m.content,
          timestamp: "",
        }))
      )
    } catch (err) {
      console.error("Failed to load messages:", err)
      setMessages([])
    }
  }, [])

  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      try {
        await deleteThread(chatId)
        setChats((prev) => prev.filter((c) => c.id !== chatId))
        if (currentChatId === chatId) {
          handleNewChat()
        }
      } catch (err) {
        console.error("Failed to delete thread:", err)
      }
    },
    [currentChatId, handleNewChat]
  )

  const handleStarChat = (chatId: string) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, isStarred: !c.isStarred } : c)))
  }

  const handleRenameChat = useCallback(async (chatId: string, newTitle: string) => {
    try {
      await renameThread(chatId, newTitle)
      setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c)))
    } catch (err) {
      console.error("Failed to rename thread:", err)
    }
  }, [])

  // ─── Branch/Checkpoint (Phase 4 stubs) ─────────────────
  const handleBranch = (messageId: string) => {
    console.log("Creating branch from message:", messageId)
  }

  const handleCheckpoint = (messageId: string) => {
    console.log("Creating checkpoint at message:", messageId)
  }

  const handleReplay = (checkpointId: string) => {
    console.log("Replaying from checkpoint:", checkpointId)
  }

  // ─── Connection ────────────────────────────────────────
  const handleReconnect = useCallback(() => {
    setConnectionStatus("reconnecting")
    checkHealth()
      .then(() => {
        setConnectionStatus("connected")
      })
      .catch(() => {
        setConnectionStatus("error")
      })
  }, [])

  const handleRejoin = () => {
    setShowRejoinBanner(false)
    setMissedMessages(0)
  }

  // ─── Approval ──────────────────────────────────────────
  const handleApprove = useCallback(
    async (requestId: string) => {
      if (currentRunId) {
        try {
          await interruptRun(currentRunId, "approve")
        } catch (err) {
          console.error("Failed to approve:", err)
        }
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `操作已批准执行。请求 ID: ${requestId.substring(0, 8)}... 已获得授权，系统将立即执行操作。`,
          timestamp: nowTs(),
        },
      ])
      setShowApprovalDialog(false)
      setApprovalRequest(null)
    },
    [currentRunId]
  )

  const handleReject = useCallback(
    async (requestId: string) => {
      if (currentRunId) {
        try {
          await interruptRun(currentRunId, "reject")
        } catch (err) {
          console.error("Failed to reject:", err)
        }
      }
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `操作已被拒绝。请求 ID: ${requestId.substring(0, 8)}... 未获得授权，操作已取消。`,
          timestamp: nowTs(),
        },
      ])
      setShowApprovalDialog(false)
      setApprovalRequest(null)
    },
    [currentRunId]
  )

  // ─── Document ──────────────────────────────────────────
  const handleDocumentSave = useCallback(async () => {
    if (!currentDocId) return
    setIsDocumentSaving(true)
    try {
      const res = await saveDocument(currentDocId, documentContent, "手动保存")
      setDocumentVersions((prev) => [
        {
          id: res.version.id,
          timestamp: new Date(res.version.timestamp * 1000).toLocaleTimeString("zh-CN"),
          label: res.version.label,
        },
        ...prev,
      ])
    } catch (err) {
      console.error("Failed to save document:", err)
    }
    setIsDocumentSaving(false)
  }, [currentDocId, documentContent])

  const handleDocumentExport = (format: "md" | "docx" | "pdf") => {
    console.log("Exporting as:", format)
  }

  const [quickTool, setQuickTool] = useState<"search" | "document" | "sandbox" | null>(null)

  const handleQuickAction = (action: string) => {
    if (action === "ticket") {
      setShowTicketPanel(true)
    } else if (action === "search" || action === "document" || action === "sandbox") {
      setQuickTool(action)
    }
  }

  // ─── Sandbox rerun ─────────────────────────────────────
  const handleSandboxRerun = useCallback(async () => {
    setSandboxStatus("running")
    setSandboxSteps([
      { id: "1", name: "初始化测试环境", status: "running" },
      { id: "2", name: "加载工单/上下文", status: "pending" },
      { id: "3", name: "执行诊断", status: "pending" },
    ])
    try {
      const res = await runSandbox(undefined, loadedTicketIds, currentChatId)
      setSandboxSteps(
        res.steps.map((s) => ({
          id: s.id,
          name: s.name,
          status: (s.status === "success" ? "success" : s.status === "failed" ? "error" : "success") as SandboxStep["status"],
          duration: s.duration,
          logs: s.logs,
          code: s.code,
          output: s.output,
        }))
      )
      setSandboxStatus("completed")
    } catch (err) {
      console.error("Sandbox rerun failed:", err)
      setSandboxStatus("error")
    }
  }, [loadedTicketIds, currentChatId])

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        tickets={sidebarTickets}
        branches={mockBranches}
        selectedTickets={loadedTicketIds}
        onSelectTicket={(id) => {
          if (loadedTicketIds.includes(id)) {
            setLoadedTicketIds((prev) => prev.filter((tid) => tid !== id))
          } else {
            setSelectedTicketIds([id])
            setShowTicketPanel(true)
          }
        }}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onStarChat={handleStarChat}
        onSelectBranch={setCurrentBranchId}
        currentChatId={currentChatId}
        currentBranchId={currentBranchId}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          onToggleTicketPanel={() => setShowTicketPanel((prev) => !prev)}
          onReturnToSystem={() => window.history.back()}
          showTicketPanel={showTicketPanel}
          selectedTicketsCount={loadedTicketIds.length}
          username="admin"
        >
          {/* Branch Selector */}
          <ConversationBranch
            branches={mockBranches}
            currentBranchId={currentBranchId}
            checkpoints={mockCheckpoints}
            onSwitchBranch={setCurrentBranchId}
            onCreateBranch={handleBranch}
            onReplay={handleReplay}
          />
          {/* Connection Status */}
          <ConnectionStatus
            status={connectionStatus}
            onReconnect={handleReconnect}
            missedMessages={missedMessages}
          />
        </Header>

        <div className="relative flex flex-1 overflow-hidden">
          {/* Rejoin Banner */}
          <RejoinBanner
            isVisible={showRejoinBanner}
            missedMessages={missedMessages}
            onRejoin={handleRejoin}
            onDismiss={() => setShowRejoinBanner(false)}
          />

          {/* Chat Area */}
          <div className="flex flex-1 flex-col">
            {/* Messages or Welcome */}
            <div className="flex-1 overflow-hidden">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <WelcomeArea username="admin" onQuickAction={handleQuickAction} />
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="mx-auto max-w-3xl pb-4">
                    {messages.map((msg) => (
                      <Message
                        key={msg.id}
                        {...msg}
                        onBranch={handleBranch}
                        onCheckpoint={handleCheckpoint}
                        onShowSources={() => setShowSourcesPanel(true)}
                      />
                    ))}
                    {isLoading && messages[messages.length - 1]?.content === "" && null}
                    {isLoading && (messages.length === 0 || messages[messages.length - 1]?.content !== "") && (
                      <Message role="assistant" content="" isLoading />
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border bg-background py-4">
              <ChatInput
                onSend={(msg, opts) => {
                  setQuickTool(null)
                  handleSend(msg, opts)
                }}
                disabled={isLoading}
                selectedTickets={loadedTicketIds}
                initialTool={quickTool}
              />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                运营大脑可能会出错，请核实重要信息
              </p>
            </div>
          </div>

          {/* Right Panels */}
          {showTicketPanel && (
            <TicketPanel
              tickets={tickets}
              selectedTicketIds={selectedTicketIds}
              onToggleTicket={handleToggleTicket}
              onClose={() => setShowTicketPanel(false)}
              onConfirm={handleConfirmTickets}
            />
          )}

          {showSourcesPanel && !showTicketPanel && (
            <SourcesPanel
              sources={currentSources}
              isExpanded={sourcesExpanded}
              onToggleExpand={() => setSourcesExpanded(!sourcesExpanded)}
              onClose={() => setShowSourcesPanel(false)}
              searchDepth={searchDepth}
              searchSteps={searchSteps}
            />
          )}

          {showSandboxPanel && !showTicketPanel && !showSourcesPanel && (
            <SandboxPanel
              isVisible={showSandboxPanel}
              isExpanded={sandboxExpanded}
              onToggleExpand={() => setSandboxExpanded(!sandboxExpanded)}
              onClose={() => setShowSandboxPanel(false)}
              status={sandboxStatus}
              steps={sandboxSteps}
              environment="Python 3.12"
              ticketContext={loadedTicketIds}
              onRerun={handleSandboxRerun}
              onStop={() => setSandboxStatus("idle")}
            />
          )}

          {showDocumentWorkspace && !showTicketPanel && !showSourcesPanel && !showSandboxPanel && (
            <DocumentWorkspace
              isVisible={showDocumentWorkspace}
              isExpanded={documentExpanded}
              onToggleExpand={() => setDocumentExpanded(!documentExpanded)}
              onClose={() => setShowDocumentWorkspace(false)}
              title={documentTitle}
              content={documentContent}
              onTitleChange={setDocumentTitle}
              onContentChange={setDocumentContent}
              onSave={handleDocumentSave}
              onExport={handleDocumentExport}
              versions={documentVersions}
              isGenerating={isDocumentGenerating}
              isSaving={isDocumentSaving}
            />
          )}
        </div>
      </div>

      {/* Approval Dialog */}
      <ApprovalDialog
        request={approvalRequest}
        isOpen={showApprovalDialog}
        onApprove={handleApprove}
        onReject={handleReject}
        onClose={() => setShowApprovalDialog(false)}
      />
    </div>
  )
}
