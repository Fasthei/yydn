"use client"

import { useState } from "react"
import { 
  Sparkles, 
  User, 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw, 
  GitBranch, 
  Clock,
  Check,
  MoreHorizontal,
  Trash2,
  Edit3,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Source } from "./sources-panel"

interface MessageProps {
  id?: string
  role: "user" | "assistant"
  content: string
  timestamp?: string
  isLoading?: boolean
  toolUsed?: string
  ticketContext?: string[]
  sources?: Source[]
  hasBranch?: boolean
  branchCount?: number
  onBranch?: (messageId: string) => void
  onCheckpoint?: (messageId: string) => void
  onRegenerate?: (messageId: string) => void
  onShowSources?: () => void
  onCopy?: () => void
}

export function Message({
  id,
  role,
  content,
  timestamp,
  isLoading,
  toolUsed,
  ticketContext,
  sources = [],
  hasBranch,
  branchCount = 0,
  onBranch,
  onCheckpoint,
  onRegenerate,
  onShowSources,
  onCopy,
}: MessageProps) {
  const isUser = role === "user"
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState<boolean | null>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    onCopy?.()
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "group relative flex gap-4 px-4 py-6 transition-colors",
          isUser ? "bg-transparent" : "bg-muted/30",
          "hover:bg-muted/20"
        )}
      >
        {/* Avatar */}
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback
            className={cn(
              "text-sm",
              isUser
                ? "bg-primary/20 text-primary"
                : "bg-gradient-to-br from-primary/30 to-accent/30 text-primary"
            )}
          >
            {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 space-y-2">
          {/* Header with tool/ticket info */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2 text-xs">
              {toolUsed && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {toolUsed}
                </Badge>
              )}
              {ticketContext?.map((ticket) => (
                <Badge
                  key={ticket}
                  variant="outline"
                  className="text-muted-foreground"
                >
                  #{ticket}
                </Badge>
              ))}
              {sources.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-xs text-primary"
                  onClick={onShowSources}
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  {sources.length} 条引用
                </Button>
              )}
              {hasBranch && branchCount > 0 && (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <GitBranch className="h-3 w-3" />
                  {branchCount} 分支
                </Badge>
              )}
            </div>

            {/* Branch/Checkpoint actions - visible on hover */}
            {id && !isLoading && (
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => onBranch?.(id)}
                    >
                      <GitBranch className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>从此处创建分支</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => onCheckpoint?.(id)}
                    >
                      <Clock className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>创建检查点</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="prose prose-invert max-w-none">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-sm text-muted-foreground">正在思考...</span>
              </div>
            ) : (
              <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                {content}
              </div>
            )}
          </div>

          {/* Actions (for assistant messages) */}
          {!isUser && !isLoading && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{copied ? "已复制" : "复制"}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-7 w-7",
                        liked === true ? "text-green-500" : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setLiked(liked === true ? null : true)}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>有帮助</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-7 w-7",
                        liked === false ? "text-red-500" : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setLiked(liked === false ? null : false)}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>没帮助</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => id && onRegenerate?.(id)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>重新生成</TooltipContent>
                </Tooltip>
              </div>

              {/* More actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => id && onBranch?.(id)}>
                    <GitBranch className="mr-2 h-4 w-4" />
                    从此处分支
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => id && onCheckpoint?.(id)}>
                    <Clock className="mr-2 h-4 w-4" />
                    创建检查点
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Edit3 className="mr-2 h-4 w-4" />
                    编辑消息
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Timestamp */}
          {timestamp && (
            <p className="text-xs text-muted-foreground">{timestamp}</p>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
