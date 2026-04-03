"use client"

// Cache bust: Clear old compilation errors
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

// Mock data
const mockChats = [
  { id: "1", title: "API 接口性能优化讨论", branchCount: 2, isStarred: true },
  { id: "2", title: "用户登录问题排查", branchCount: 0 },
  { id: "3", title: "数据库迁移方案", branchCount: 1 },
  { id: "4", title: "新功能需求分析", branchCount: 0 },
  { id: "5", title: "系统架构设计", branchCount: 0 },
]

const mockTickets = [
  {
    id: "TK-1001",
    title: "生产环境 API 响应超时",
    description: "用户反馈在高峰期 API 响应时间超过 30 秒，需要紧急排查和优化",
    status: "open" as const,
    priority: "high" as const,
    createdAt: "2 小时前",
    assignee: "张三",
  },
  {
    id: "TK-1002",
    title: "用户无法登录系统",
    description: "部分用户反馈无法通过 SSO 登录，显示 401 错误",
    status: "pending" as const,
    priority: "high" as const,
    createdAt: "4 小时前",
    assignee: "李四",
  },
  {
    id: "TK-1003",
    title: "报表导出功能异常",
    description: "导出 Excel 时数据格式不正确，日期字段显示为数字",
    status: "open" as const,
    priority: "medium" as const,
    createdAt: "1 天前",
  },
  {
    id: "TK-1004",
    title: "移动端适配问题",
    description: "在 iOS 设备上页面布局错乱，部分按钮无法点击",
    status: "pending" as const,
    priority: "medium" as const,
    createdAt: "2 天前",
  },
  {
    id: "TK-1005",
    title: "权限配置优化",
    description: "需要支持更细粒度的权限控制，按模块分配功能权限",
    status: "closed" as const,
    priority: "low" as const,
    createdAt: "3 天前",
  },
]

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
  const [chats, setChats] = useState(mockChats)

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

  // Connection State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>("connected")
  const [showRejoinBanner, setShowRejoinBanner] = useState(false)
  const [missedMessages, setMissedMessages] = useState(0)

  // Approval State
  const [approvalRequest, setApprovalRequest] = useState<ApprovalRequest | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const sidebarTickets = mockTickets.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    selected: loadedTicketIds.includes(t.id),
  }))

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleToggleTicket = (ticketId: string) => {
    setSelectedTicketIds((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    )
  }

  const handleConfirmTickets = () => {
    setLoadedTicketIds(selectedTicketIds)
    setShowTicketPanel(false)
    
    if (selectedTicketIds.length > 0) {
      const ticketTitles = selectedTicketIds
        .map((id) => mockTickets.find((t) => t.id === id)?.title)
        .filter(Boolean)
        .join("、")
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `已加载 ${selectedTicketIds.length} 个工单到当前对话：${ticketTitles}。\n\n现在你可以针对这些工单进行提问，我会基于工单内容为你���供帮助。`,
          timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
          ticketContext: selectedTicketIds,
        },
      ])
    }
  }

  const simulateDeepSearch = async () => {
    setSearchSteps([
      { step: "分析查询意图", status: "completed", detail: "识别关键词和搜索范围" },
      { step: "搜索网络资源", status: "in-progress", detail: "正在检索 15 个相关网页..." },
      { step: "检索知识库", status: "pending" },
      { step: "查询内部文档", status: "pending" },
      { step: "整合与排序", status: "pending" },
    ])

    await new Promise(r => setTimeout(r, 800))
    setSearchSteps(prev => prev.map((s, i) => 
      i === 1 ? { ...s, status: "completed" as const, detail: "已检索 15 个网页" } :
      i === 2 ? { ...s, status: "in-progress" as const, detail: "正在匹配知识库..." } : s
    ))

    await new Promise(r => setTimeout(r, 600))
    setSearchSteps(prev => prev.map((s, i) => 
      i === 2 ? { ...s, status: "completed" as const, detail: "匹配到 8 条记录" } :
      i === 3 ? { ...s, status: "in-progress" as const, detail: "正在查询内部手册..." } : s
    ))

    await new Promise(r => setTimeout(r, 500))
    setSearchSteps(prev => prev.map((s, i) => 
      i === 3 ? { ...s, status: "completed" as const, detail: "找到 3 份相关文档" } :
      i === 4 ? { ...s, status: "in-progress" as const, detail: "正在智能排序..." } : s
    ))

    await new Promise(r => setTimeout(r, 400))
    setSearchSteps(prev => prev.map((s, i) => 
      i === 4 ? { ...s, status: "completed" as const, detail: "完成" } : s
    ))

    // Generate mock sources
    setCurrentSources([
      { id: "1", type: "web", title: "API 性能优化最佳实践", url: "https://example.com/api-perf", snippet: "本文介绍了 API 性能优化的多种方法，包括缓存策略、数据库查询优化、连接池配置等...", score: 0.95, domain: "example.com" },
      { id: "2", type: "kb", title: "内部性能调优指南 v2.0", snippet: "针对我们的微服务架构，推荐的性能调优步骤包括：1. 分析慢查询日志 2. 检查服务间调用链路...", score: 0.88 },
      { id: "3", type: "web", title: "Node.js 高并发处理", url: "https://blog.example.com/nodejs", snippet: "在高并发场景下，Node.js 需要特别注意事件循环阻塞问题...", score: 0.82, domain: "blog.example.com" },
      { id: "4", type: "internal", title: "Q2 性能报告", snippet: "根据本季度监控数据，主要性能瓶颈集中在数据库连接和外部 API 调用...", score: 0.78 },
      { id: "5", type: "kb", title: "故障排查手册", snippet: "当 API 响应超时时，按以下顺序排查：网络延迟、服务负载、数据库性能...", score: 0.75 },
    ])
    setShowSourcesPanel(true)
  }

  const simulateSandboxExecution = async () => {
    setShowSandboxPanel(true)
    setSandboxStatus("running")
    setSandboxSteps([
      { id: "1", name: "初始化测试环境", status: "running" },
      { id: "2", name: "加载工单数据", status: "pending" },
      { id: "3", name: "执行诊断脚本", status: "pending" },
      { id: "4", name: "分析执行结果", status: "pending" },
    ])

    await new Promise(r => setTimeout(r, 800))
    setSandboxSteps(prev => prev.map((s, i) => 
      i === 0 ? { ...s, status: "success" as const, duration: "0.8s", logs: ["[INFO] 环境初始化完成", "[INFO] Node.js v20.x 就绪"] } :
      i === 1 ? { ...s, status: "running" as const } : s
    ))

    await new Promise(r => setTimeout(r, 600))
    setSandboxSteps(prev => prev.map((s, i) => 
      i === 1 ? { ...s, status: "success" as const, duration: "0.6s", logs: ["[INFO] 已加载 2 个工单", "[INFO] 解析工单内容..."] } :
      i === 2 ? { ...s, status: "running" as const } : s
    ))

    await new Promise(r => setTimeout(r, 1200))
    setSandboxSteps(prev => prev.map((s, i) => 
      i === 2 ? { 
        ...s, 
        status: "success" as const, 
        duration: "1.2s", 
        code: "const result = await diagnose(tickets);\nconsole.log(result);",
        logs: ["[INFO] 执行诊断脚本...", "[INFO] 检测到 3 个潜在问题"] 
      } :
      i === 3 ? { ...s, status: "running" as const } : s
    ))

    await new Promise(r => setTimeout(r, 500))
    setSandboxSteps(prev => prev.map((s, i) => 
      i === 3 ? { 
        ...s, 
        status: "success" as const, 
        duration: "0.5s",
        output: "诊断完成。发现问题：\n1. 数据库连接池配置不当\n2. 缺少查询缓存\n3. API 调用无超时设置"
      } : s
    ))
    setSandboxStatus("completed")
  }

  const simulateDocumentGeneration = async () => {
    setShowDocumentWorkspace(true)
    setIsDocumentGenerating(true)
    setDocumentTitle("API 性能优化方案")
    setDocumentContent("")

    const content = `# API 性能优化方案

## 1. 问题概述

根据工单 TK-1001 的描述，生产环境 API 在高峰期响应时间超过 30 秒，严重影响用户体验。

## 2. 问题分析

### 2.1 根本原因
- 数据库连接池配置不当
- 缺少有效的查询缓存机制
- API 调用缺少超时设置

### 2.2 影响范围
- 影响所有核心业务 API
- 高峰期用户流失率上升 15%

## 3. 优化方案

### 3.1 短期措施
1. 调整数据库连接池大小
2. 添加 Redis 查询缓存
3. 设置合理的 API 超时时间

### 3.2 长期优化
1. 引入读写分离架构
2. 实施数据库分片策略
3. 部署 CDN 加速静态资源

## 4. 实施计划

| 阶段 | 任务 | 负责人 | 预计完成时间 |
|------|------|--------|------------|
| 第一阶段 | 连接池优化 | 张三 | 3 天 |
| 第二阶段 | 缓存机制 | 李四 | 5 天 |
| 第三阶段 | 架构升级 | 团队 | 2 周 |

## 5. 预期效果

- API 响应时间降低 80%
- 系统吞吐量提升 3 倍
- 用户满意度提升至 95%`

    // Simulate streaming content
    for (let i = 0; i < content.length; i += 20) {
      await new Promise(r => setTimeout(r, 30))
      setDocumentContent(content.slice(0, i + 20))
    }
    
    setIsDocumentGenerating(false)
    setDocumentVersions([
      { id: "v1", timestamp: new Date().toLocaleTimeString("zh-CN"), label: "AI 生成初稿" }
    ])
  }

  const triggerApprovalRequest = (type: "dangerous" | "sensitive" | "external" | "data-modify" = "sensitive") => {
    const approvalTypes = {
      dangerous: {
        title: "高危操作需要审批",
        description: "检测到您即将执行一个高危操作。这个操作可能影响生产环境数据和服务，需要获得授权才能继续。",
        details: {
          action: "删除生产数据库记录",
          target: "orders_2024_q1",
          impact: "影响 50000+ 个订单记录",
          reversible: false,
        },
        code: "DELETE FROM orders WHERE created_at < '2024-01-01';"
      },
      sensitive: {
        title: "敏感信息访问需要确认",
        description: "您正在尝试访问包含用户隐私信息的数据。为了保护用户隐私，需要您的确认才能继续。",
        details: {
          action: "导出用户个人信息",
          target: "user_table (personal_info 字段)",
          impact: "涉及 10000+ 用户的敏感数据",
          reversible: true,
        }
      },
      external: {
        title: "外部接口调用需要批准",
        description: "检测到需要调用外部第三方接口。为了安全性审计，需要获得批准后才能执行。",
        details: {
          action: "调用支付网关 API",
          target: "https://payment.external.com/api/charge",
          impact: "可能产生真实交易",
          reversible: false,
        }
      },
      "data-modify": {
        title: "数据变更操作需要审核",
        description: "系统检测到此操作将修改关键业务数据。为了确保数据一致性，需要二次确认。",
        details: {
          action: "批量更新用户权限",
          target: "user_permissions 表",
          impact: "影响 5000+ 个用���的系统访问权限",
          reversible: true,
        }
      }
    }

    const config = approvalTypes[type]
    setApprovalRequest({
      id: Date.now().toString(),
      type,
      title: config.title,
      description: config.description,
      details: config.details,
      code: config.code,
      timestamp: new Date().toISOString()
    })
    setShowApprovalDialog(true)
  }

  const handleApprove = (requestId: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `✅ 操作已批准执行。请求 ID: ${requestId.substring(0, 8)}... 已获得授权，系统将立即执行操作。`,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      }
    ])
    setShowApprovalDialog(false)
    setApprovalRequest(null)
  }

  const handleReject = (requestId: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `❌ 操作已被拒绝。请求 ID: ${requestId.substring(0, 8)}... 未获得授权，操作已取消。`,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      }
    ])
    setShowApprovalDialog(false)
    setApprovalRequest(null)
  }

  const handleSend = async (
    message: string,
    options: { searchMode: "quick" | "deep" | null; tool: "search" | "document" | "sandbox" | null }
  ) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      ticketContext: loadedTicketIds.length > 0 ? loadedTicketIds : undefined,
    }
    
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Handle different tools
    if (options.tool === "search" && options.searchMode === "deep") {
      setSearchDepth("deep")
      await simulateDeepSearch()
    } else if (options.tool === "sandbox") {
      await simulateSandboxExecution()
    } else if (options.tool === "document") {
      await simulateDocumentGeneration()
    }

    // Simulate AI response
    setTimeout(() => {
      let toolUsed: string | undefined
      let sources: Source[] | undefined

      if (options.tool === "search") {
        toolUsed = options.searchMode === "deep" ? "深度搜索" : "快速搜索"
        if (options.searchMode === "deep") {
          sources = currentSources
        }
      } else if (options.tool === "document") {
        toolUsed = "文档生成"
      } else if (options.tool === "sandbox") {
        toolUsed = "沙盒执行"
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateMockResponse(message, options, loadedTicketIds),
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        toolUsed,
        sources,
        ticketContext: loadedTicketIds.length > 0 ? loadedTicketIds : undefined,
      }
      
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, options.tool === "search" && options.searchMode === "deep" ? 500 : 1500)
  }

  const handleNewChat = () => {
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
  }

  const handleDeleteChat = (chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId))
    if (currentChatId === chatId) {
      handleNewChat()
    }
  }

  const handleStarChat = (chatId: string) => {
    setChats(prev => prev.map(c => 
      c.id === chatId ? { ...c, isStarred: !c.isStarred } : c
    ))
  }

  const handleBranch = (messageId: string) => {
    // In real implementation, this would create a new branch
    console.log("Creating branch from message:", messageId)
  }

  const handleCheckpoint = (messageId: string) => {
    // In real implementation, this would create a checkpoint
    console.log("Creating checkpoint at message:", messageId)
  }

  const handleReplay = (checkpointId: string) => {
    console.log("Replaying from checkpoint:", checkpointId)
  }

  const handleReconnect = () => {
    setConnectionStatus("reconnecting")
    setTimeout(() => {
      setConnectionStatus("connected")
      setShowRejoinBanner(true)
      setMissedMessages(2)
    }, 1500)
  }

  const handleRejoin = () => {
    setShowRejoinBanner(false)
    setMissedMessages(0)
  }

  const handleQuickAction = (action: string) => {
    if (action === "ticket") {
      setShowTicketPanel(true)
    }
  }

  const handleDocumentSave = () => {
    setIsDocumentSaving(true)
    setTimeout(() => {
      setIsDocumentSaving(false)
      setDocumentVersions(prev => [
        { id: `v${prev.length + 1}`, timestamp: new Date().toLocaleTimeString("zh-CN"), label: "手动保存" },
        ...prev
      ])
    }, 800)
  }

  const handleDocumentExport = (format: "md" | "docx" | "pdf") => {
    console.log("Exporting as:", format)
  }

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
        onSelectChat={setCurrentChatId}
        onDeleteChat={handleDeleteChat}
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
                    {isLoading && (
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
                onSend={handleSend}
                disabled={isLoading}
                selectedTickets={loadedTicketIds}
              />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                运营大脑可能会出错，请核实重要信息
              </p>
            </div>
          </div>

          {/* Right Panels */}
          {showTicketPanel && (
            <TicketPanel
              tickets={mockTickets}
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
              environment="Node.js v20.x"
              ticketContext={loadedTicketIds}
              onRerun={simulateSandboxExecution}
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

function generateMockResponse(
  message: string,
  options: { searchMode: "quick" | "deep" | null; tool: "search" | "document" | "sandbox" | null },
  ticketIds: string[]
): string {
  if (ticketIds.length > 0 && options.tool === "sandbox") {
    return `沙盒执行已完成。根据工单内容进行了诊断分析：

**诊断结果**

发现以下问题：
1. **数据库连接池配置不当** - 当前配置的最大连接数为 10，建议提升至 50
2. **缺少查询缓存** - 重复查询占比 40%，建议添加 Redis 缓存层
3. **API 调用无超时设置** - 外部 API 调用可能导致请求堆积

**建议措施**
- 立即调整连接池配置
- 部署 Redis 缓存服务
- 添加 30 秒超时设置

右侧面板可查看详细执行过程和日志。`
  }

  if (options.tool === "search") {
    if (options.searchMode === "deep") {
      return `我已完成深度搜索，整合了来自网络、知识库和内部文档的信息。

**搜索概要**
- 检索了 15 个网络资源
- 匹配到 8 条知识库记录  
- 找到 3 份内部文档

**核心发现**

1. **API 性能优化的关键点**
   根据最佳实践指南，API 超时问题通常与数据库查询和连接池配置相关。

2. **内部案例参考**
   Q2 性能报告显示，类似问题通过优化数据库索引和添加缓存层得到解决。

3. **推荐解决方案**
   - 短期：调整连接池参数，添加查询缓存
   - 长期：考虑读写分离和服务拆分

点击右侧「参考资料」面板可查看所有引用来源和匹配分数。`
    }
    return `我已快速搜索了相关信息：

**搜索结果摘要**

关于"${message}"的主要内容如下：

1. 这是一个常见的技术问题
2. 建议采用最佳实践进行处理
3. 可以参考相关文档获取更多信息

如需更详细的分析，可以使用「深度搜索」功能。`
  }

  if (options.tool === "document") {
    return `文档已生成完成，请在右侧工作区查看和编辑。

**文档概要**
- 标题：API 性能优化方案
- 包含：问题分析、优化方案、实施计划
- 字数：约 800 字

您可以：
- 在工作区直接编辑内容
- 使用 AI 润色功能优化文字
- 导出为 Markdown、Word 或 PDF 格式`
  }

  if (ticketIds.length > 0) {
    return `根据你加载的工单内容分析：

**问题概述**
${ticketIds.map((id) => `- 工单 #${id}`).join("\n")}

**分析结果**
基于工单描述，这些问题可能存在关联。建议从以下几个方面入手：

1. **检查系统日志** - 查看对应时间段的错误日志
2. **性能监控** - 分析系统资源使用情况
3. **代码审查** - 检查最近的代码变更

需要我进一步分析某个具体方面吗？你也可以使用沙盒功能进行诊断测试。`
  }

  return `我理解你的问题是关于"${message}"。

让我为你分析一下：

这是一个很好的问题。根据我的了解，你可以考虑以下几个方面：

1. **首先**，需要明确具体的需求和目标
2. **其次**，分析现有的解决方案
3. **最后**，制定实施计划

如果你需要更详细的信息，可以：
- 使用**深度搜索**获取更多资料
- 加载相关**工单**提供上下文
- 使用**沙盒**进行测试验证`
}
