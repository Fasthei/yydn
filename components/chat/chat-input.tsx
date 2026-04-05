"use client"

import React, { useState, useRef, useEffect, KeyboardEvent } from "react"
import {
  Plus,
  Globe,
  FileText,
  Box,
  ChevronDown,
  Send,
  Zap,
  Search,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type SearchMode = "quick" | "deep" | null
type Tool = "search" | "document" | "sandbox" | null

interface ChatInputProps {
  onSend: (message: string, options: { searchMode: SearchMode; tool: Tool }) => void
  disabled?: boolean
  placeholder?: string
  selectedTickets?: string[]
  initialTool?: Tool
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "输入任何内容，搜索数据，@提及或 /工具",
  selectedTickets = [],
  initialTool,
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [searchMode, setSearchMode] = useState<SearchMode>(null)
  const [activeTool, setActiveTool] = useState<Tool>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Allow parent to activate a tool (e.g. from welcome quick actions)
  useEffect(() => {
    if (initialTool) {
      setActiveTool(initialTool)
      if (initialTool === "search") setSearchMode("deep")
      textareaRef.current?.focus()
    }
  }, [initialTool])

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message, { searchMode, tool: activeTool })
      setMessage("")
      setSearchMode(null)
      setActiveTool(null)
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  const toggleSearchMode = (mode: SearchMode) => {
    if (searchMode === mode) {
      setSearchMode(null)
    } else {
      setSearchMode(mode)
      setActiveTool("search")
    }
  }

  const toggleTool = (tool: Tool) => {
    if (activeTool === tool) {
      setActiveTool(null)
      if (tool === "search") setSearchMode(null)
    } else {
      setActiveTool(tool)
      if (tool !== "search") setSearchMode(null)
    }
  }

  return (
    <TooltipProvider>
      <div className="mx-auto w-full max-w-3xl px-4">
        {/* Selected Tickets Pills */}
        {selectedTickets.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {selectedTickets.map((ticket) => (
              <div
                key={ticket}
                className="flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs text-primary"
              >
                <span>#{ticket}</span>
              </div>
            ))}
          </div>
        )}

        {/* Main Input Container */}
        <div className="relative rounded-2xl bg-card border border-border shadow-lg">
          {/* Textarea */}
          <div className="px-4 pt-4">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="w-full resize-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              style={{ minHeight: "24px", maxHeight: "200px" }}
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-1">
              {/* Add Button */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>添加附件</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem>
                    <FileText className="mr-2 h-4 w-4" />
                    上传文件
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Globe className="mr-2 h-4 w-4" />
                    添加链接
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Search Tool */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8 rounded-full",
                          activeTool === "search"
                            ? "bg-primary/20 text-primary hover:bg-primary/30"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Globe className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>知识搜索</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>知识搜索模式</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => toggleSearchMode("quick")}
                    className={cn(searchMode === "quick" && "bg-primary/20")}
                  >
                    <Zap className="mr-2 h-4 w-4 text-yellow-500" />
                    <div className="flex flex-col">
                      <span>快速搜索</span>
                      <span className="text-xs text-muted-foreground">
                        快速检索知识库
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => toggleSearchMode("deep")}
                    className={cn(searchMode === "deep" && "bg-primary/20")}
                  >
                    <Search className="mr-2 h-4 w-4 text-blue-500" />
                    <div className="flex flex-col">
                      <span>深度搜索</span>
                      <span className="text-xs text-muted-foreground">
                        深度检索并分析知识库文档
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Document Tool */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleTool("document")}
                    className={cn(
                      "h-8 w-8 rounded-full",
                      activeTool === "document"
                        ? "bg-primary/20 text-primary hover:bg-primary/30"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <FileText className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>生成文档</TooltipContent>
              </Tooltip>

              {/* Sandbox Tool */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleTool("sandbox")}
                    className={cn(
                      "h-8 w-8 rounded-full",
                      activeTool === "sandbox"
                        ? "bg-primary/20 text-primary hover:bg-primary/30"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Box className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>沙盒环境</TooltipContent>
              </Tooltip>

              {/* Active Tool Indicator */}
              {(activeTool || searchMode) && (
                <div className="ml-2 flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                  {activeTool === "search" && searchMode === "quick" && (
                    <>
                      <Zap className="h-3 w-3" />
                      <span>快速搜索</span>
                    </>
                  )}
                  {activeTool === "search" && searchMode === "deep" && (
                    <>
                      <Search className="h-3 w-3" />
                      <span>深度搜索</span>
                    </>
                  )}
                  {activeTool === "document" && (
                    <>
                      <FileText className="h-3 w-3" />
                      <span>生成文档</span>
                    </>
                  )}
                  {activeTool === "sandbox" && (
                    <>
                      <Box className="h-3 w-3" />
                      <span>沙盒</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Model Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>运营大脑 Pro</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Sparkles className="mr-2 h-4 w-4 text-primary" />
                    运营大脑 Pro
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Zap className="mr-2 h-4 w-4 text-yellow-500" />
                    运营大脑 Flash
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Send Button */}
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!message.trim() || disabled}
                className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
