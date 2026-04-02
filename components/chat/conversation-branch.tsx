"use client"

import { useState } from "react"
import { GitBranch, Clock, Play, ChevronDown, Check, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface Branch {
  id: string
  name: string
  chatId: string
  parentId?: string
  parentMessageId?: string
  createdAt: string
  isActive: boolean
  messageCount: number
}

export interface Checkpoint {
  id: string
  messageId: string
  timestamp: string
  preview: string
  branchId: string
}

interface ConversationBranchProps {
  branches: Branch[]
  currentBranchId: string
  checkpoints: Checkpoint[]
  onSwitchBranch: (branchId: string) => void
  onCreateBranch: (fromMessageId: string, name: string) => void
  onReplay: (checkpointId: string) => void
}

export function ConversationBranch({
  branches,
  currentBranchId,
  checkpoints,
  onSwitchBranch,
  onCreateBranch,
  onReplay,
}: ConversationBranchProps) {
  const currentBranch = branches.find(b => b.id === currentBranchId)
  const currentCheckpoints = checkpoints.filter(c => c.branchId === currentBranchId)

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Branch Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <GitBranch className="h-3.5 w-3.5 text-primary" />
              <span className="max-w-[100px] truncate">{currentBranch?.name || "主分支"}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              对话分支
            </div>
            {branches.map(branch => (
              <DropdownMenuItem
                key={branch.id}
                onClick={() => onSwitchBranch(branch.id)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <GitBranch className={cn(
                    "h-3.5 w-3.5",
                    branch.id === currentBranchId ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    branch.id === currentBranchId && "font-medium"
                  )}>
                    {branch.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {branch.messageCount} 条
                  </span>
                  {branch.id === currentBranchId && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-primary">
              <Plus className="mr-2 h-3.5 w-3.5" />
              创建新分支
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Checkpoint Selector */}
        {currentCheckpoints.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">检查点</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                时光机 - 回放历史节点
              </div>
              {currentCheckpoints.map(checkpoint => (
                <DropdownMenuItem
                  key={checkpoint.id}
                  onClick={() => onReplay(checkpoint.id)}
                  className="flex flex-col items-start gap-1"
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {checkpoint.timestamp}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5">
                          <Play className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>回放此节点</TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="line-clamp-2 text-xs">{checkpoint.preview}</p>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </TooltipProvider>
  )
}

// Message hover actions for branching
interface MessageBranchActionsProps {
  messageId: string
  onBranch: (messageId: string) => void
  onCheckpoint: (messageId: string) => void
}

export function MessageBranchActions({
  messageId,
  onBranch,
  onCheckpoint,
}: MessageBranchActionsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onBranch(messageId)}
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
              className="h-6 w-6"
              onClick={() => onCheckpoint(messageId)}
            >
              <Clock className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>创建检查点</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
