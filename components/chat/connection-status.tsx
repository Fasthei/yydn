"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type ConnectionState = "connected" | "disconnected" | "reconnecting" | "error"

interface ConnectionStatusProps {
  status: ConnectionState
  lastSeq?: number
  onReconnect: () => void
  missedMessages?: number
}

export function ConnectionStatus({
  status,
  lastSeq,
  onReconnect,
  missedMessages = 0,
}: ConnectionStatusProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    if (status === "disconnected" || status === "error") {
      setShowTooltip(true)
    } else {
      setShowTooltip(false)
    }
  }, [status])

  if (status === "connected") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-xs text-green-500">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="sr-only">已连接</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>连接正常</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 gap-2 text-xs",
              status === "disconnected" && "text-yellow-500",
              status === "error" && "text-red-500",
              status === "reconnecting" && "text-blue-500"
            )}
            onClick={onReconnect}
          >
            {status === "disconnected" && (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                <span>已断开</span>
              </>
            )}
            {status === "reconnecting" && (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>重连中...</span>
              </>
            )}
            {status === "error" && (
              <>
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>连接错误</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            {status === "disconnected" && (
              <>
                <p className="font-medium">连接已断开</p>
                <p className="text-xs text-muted-foreground">
                  点击重新连接，我们将自动恢复您的对话
                  {missedMessages > 0 && `（${missedMessages} 条消息待同步）`}
                </p>
              </>
            )}
            {status === "error" && (
              <>
                <p className="font-medium">连接出现错误</p>
                <p className="text-xs text-muted-foreground">
                  请检查网络连接后重试
                </p>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Rejoin Banner - shows when reconnection is needed
interface RejoinBannerProps {
  isVisible: boolean
  missedMessages: number
  onRejoin: () => void
  onDismiss: () => void
}

export function RejoinBanner({
  isVisible,
  missedMessages,
  onRejoin,
  onDismiss,
}: RejoinBannerProps) {
  if (!isVisible) return null

  return (
    <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 shadow-lg">
        <WifiOff className="h-4 w-4 text-yellow-500" />
        <div className="text-sm">
          <span className="font-medium">连接已恢复</span>
          {missedMessages > 0 && (
            <span className="ml-1 text-muted-foreground">
              有 {missedMessages} 条消息需要同步
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="h-7"
            onClick={onRejoin}
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            同步消息
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={onDismiss}
          >
            忽略
          </Button>
        </div>
      </div>
    </div>
  )
}
