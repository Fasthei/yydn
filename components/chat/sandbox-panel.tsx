"use client"

import { useState } from "react"
import { 
  Play, 
  Square, 
  RotateCcw, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronDown,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  Copy,
  Download
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export interface SandboxStep {
  id: string
  name: string
  status: "pending" | "running" | "success" | "error"
  startTime?: string
  endTime?: string
  duration?: string
  logs?: string[]
  code?: string
  output?: string
  error?: string
}

interface SandboxPanelProps {
  isVisible: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onClose: () => void
  status: "idle" | "running" | "completed" | "error"
  steps: SandboxStep[]
  environment: string
  onRerun?: () => void
  onStop?: () => void
  ticketContext?: string[]
}

export function SandboxPanel({
  isVisible,
  isExpanded,
  onToggleExpand,
  onClose,
  status,
  steps,
  environment,
  onRerun,
  onStop,
  ticketContext = [],
}: SandboxPanelProps) {
  const [expandedSteps, setExpandedSteps] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"steps" | "logs" | "output">("steps")

  if (!isVisible) return null

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => 
      prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
    )
  }

  const statusIcon = (stepStatus: SandboxStep["status"]) => {
    switch (stepStatus) {
      case "success": return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "error": return <XCircle className="h-4 w-4 text-red-500" />
      case "running": return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const allLogs = steps.flatMap(s => s.logs || [])
  const finalOutput = steps.find(s => s.output)?.output

  return (
    <div className={cn(
      "flex flex-col border-l border-border bg-card transition-all duration-300",
      isExpanded ? "w-[500px]" : "w-96"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-foreground">沙盒执行</h3>
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs",
              status === "running" && "bg-blue-500/20 text-blue-400",
              status === "completed" && "bg-green-500/20 text-green-400",
              status === "error" && "bg-red-500/20 text-red-400"
            )}
          >
            {status === "running" && "执行中"}
            {status === "completed" && "已完成"}
            {status === "error" && "出错"}
            {status === "idle" && "就绪"}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {status === "running" ? (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={onStop}>
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRerun}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleExpand}>
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Environment Info */}
      <div className="flex items-center gap-4 border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span>环境: <span className="text-foreground">{environment}</span></span>
        {ticketContext.length > 0 && (
          <span>关联工单: {ticketContext.map(t => `#${t}`).join(", ")}</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border px-4 py-2">
        {(["steps", "logs", "output"] as const).map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "h-7 px-3 text-xs",
              activeTab === tab && "bg-primary/20 text-primary"
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "steps" && "执行步骤"}
            {tab === "logs" && "日志"}
            {tab === "output" && "输出"}
          </Button>
        ))}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {activeTab === "steps" && (
          <div className="space-y-2 p-4">
            {steps.map((step, idx) => (
              <Collapsible
                key={step.id}
                open={expandedSteps.includes(step.id)}
                onOpenChange={() => toggleStep(step.id)}
              >
                <div className={cn(
                  "rounded-lg border border-border transition-colors",
                  step.status === "running" && "border-blue-500/50 bg-blue-500/5",
                  step.status === "success" && "border-green-500/30 bg-green-500/5",
                  step.status === "error" && "border-red-500/30 bg-red-500/5"
                )}>
                  <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center gap-3 p-3 text-left">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs">
                        {idx + 1}
                      </span>
                      {statusIcon(step.status)}
                      <span className="flex-1 text-sm font-medium">{step.name}</span>
                      {step.duration && (
                        <span className="text-xs text-muted-foreground">{step.duration}</span>
                      )}
                      {expandedSteps.includes(step.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border p-3">
                      {step.code && (
                        <div className="mb-3">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">执行代码</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <pre className="rounded bg-muted/50 p-2 text-xs overflow-x-auto">
                            <code>{step.code}</code>
                          </pre>
                        </div>
                      )}
                      {step.logs && step.logs.length > 0 && (
                        <div className="mb-3">
                          <span className="text-xs text-muted-foreground">日志输出</span>
                          <div className="mt-1 space-y-1">
                            {step.logs.map((log, i) => (
                              <p key={i} className="font-mono text-xs text-muted-foreground">{log}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      {step.error && (
                        <div className="rounded bg-red-500/10 p-2 text-xs text-red-400">
                          {step.error}
                        </div>
                      )}
                      {step.output && (
                        <div className="rounded bg-green-500/10 p-2 text-xs text-green-400">
                          {step.output}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}

        {activeTab === "logs" && (
          <div className="p-4">
            <div className="rounded-lg bg-muted/30 p-3 font-mono text-xs">
              {allLogs.length > 0 ? (
                allLogs.map((log, i) => (
                  <div key={i} className="py-0.5 text-muted-foreground">
                    <span className="mr-2 text-muted-foreground/50">[{i + 1}]</span>
                    {log}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">暂无日志输出</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "output" && (
          <div className="p-4">
            {finalOutput ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">执行结果</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <pre className="rounded-lg bg-muted/30 p-4 text-sm overflow-x-auto whitespace-pre-wrap">
                  {finalOutput}
                </pre>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">暂无输出结果</p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
