"use client"

import { AlertTriangle, Shield, FileWarning, Database, Terminal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export type ApprovalType = "dangerous" | "sensitive" | "external" | "data-modify"

export interface ApprovalRequest {
  id: string
  type: ApprovalType
  title: string
  description: string
  details?: {
    action: string
    target?: string
    impact?: string
    reversible?: boolean
  }
  code?: string
  timestamp: string
}

interface ApprovalDialogProps {
  request: ApprovalRequest | null
  isOpen: boolean
  onApprove: (requestId: string) => void
  onReject: (requestId: string) => void
  onClose: () => void
}

export function ApprovalDialog({
  request,
  isOpen,
  onApprove,
  onReject,
  onClose,
}: ApprovalDialogProps) {
  if (!request) return null

  const typeConfig = {
    dangerous: {
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      label: "高危操作",
    },
    sensitive: {
      icon: Shield,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      label: "敏感操作",
    },
    external: {
      icon: FileWarning,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      label: "外部调用",
    },
    "data-modify": {
      icon: Database,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      label: "数据变更",
    },
  }

  const config = typeConfig[request.type]
  const Icon = config.icon

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              config.bg
            )}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                {request.title}
                <Badge variant="outline" className={cn("text-xs", config.color, config.border)}>
                  {config.label}
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1">
                需要您的确认才能继续执行
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-foreground">{request.description}</p>

          {request.details && (
            <div className={cn(
              "rounded-lg border p-3 space-y-2",
              config.border,
              config.bg
            )}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">操作类型</span>
                <span className="font-medium">{request.details.action}</span>
              </div>
              {request.details.target && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">目标对象</span>
                  <span className="font-mono text-xs">{request.details.target}</span>
                </div>
              )}
              {request.details.impact && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">影响范围</span>
                  <span>{request.details.impact}</span>
                </div>
              )}
              {request.details.reversible !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">可否撤销</span>
                  <span className={request.details.reversible ? "text-green-500" : "text-red-500"}>
                    {request.details.reversible ? "是" : "否"}
                  </span>
                </div>
              )}
            </div>
          )}

          {request.code && (
            <div>
              <p className="mb-2 text-xs text-muted-foreground">即将执行的代码</p>
              <ScrollArea className="h-32">
                <pre className="rounded-lg bg-muted p-3 text-xs overflow-x-auto">
                  <code>{request.code}</code>
                </pre>
              </ScrollArea>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            请仔细审查上述操作，确认后将立即执行。
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onReject(request.id)}
          >
            拒绝
          </Button>
          <Button
            variant="destructive"
            onClick={() => onApprove(request.id)}
            className={cn(
              request.type === "dangerous" && "bg-red-600 hover:bg-red-700"
            )}
          >
            确认执行
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
