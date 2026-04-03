"use client"

"use client"

import { useState, useEffect } from "react"
import {
  PenSquare,
  Search,
  Ticket,
  MessageSquare,
  Pin,
  ChevronRight,
  Settings,
  GitBranch,
  Trash2,
  MoreHorizontal,
  Edit3,
  Star,
  Archive,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import type { Branch } from "./conversation-branch"

interface ChatItem {
  id: string
  title: string
  date?: string
  branchCount?: number
  isStarred?: boolean
}

interface TicketItem {
  id: string
  title: string
  status: "open" | "closed" | "pending"
  selected?: boolean
}

interface SidebarProps {
  chats: ChatItem[]
  tickets: TicketItem[]
  branches?: Branch[]
  selectedTickets: string[]
  onSelectTicket: (ticketId: string) => void
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat?: (chatId: string) => void
  onRenameChat?: (chatId: string, newTitle: string) => void
  onStarChat?: (chatId: string) => void
  onSelectBranch?: (branchId: string) => void
  currentChatId?: string
  currentBranchId?: string
  isCollapsed?: boolean
}

export function Sidebar({
  chats,
  tickets,
  branches = [],
  selectedTickets,
  onSelectTicket,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onStarChat,
  onSelectBranch,
  currentChatId,
  currentBranchId,
  isCollapsed = false,
}: SidebarProps) {
  const [mounted, setMounted] = useState(false)
  const [ticketsOpen, setTicketsOpen] = useState(false)
  const [chatsOpen, setChatsOpen] = useState(false)
  const [branchesOpen, setBranchesOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setMounted(true)
    setTicketsOpen(true)
    setChatsOpen(true)
    setBranchesOpen(true)
  }, [])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const [expandedChatBranches, setExpandedChatBranches] = useState<string[]>([])

  const filteredChats = chats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentChatBranches = branches.filter(b => b.chatId === currentChatId)

  const handleDeleteClick = (chatId: string) => {
    setChatToDelete(chatId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (chatToDelete && onDeleteChat) {
      onDeleteChat(chatToDelete)
    }
    setDeleteDialogOpen(false)
    setChatToDelete(null)
  }

  const toggleChatBranches = (chatId: string) => {
    setExpandedChatBranches(prev =>
      prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]
    )
  }

  if (isCollapsed) {
    return (
      <div className="flex h-full w-16 flex-col items-center gap-2 border-r border-border bg-sidebar py-4">
        <Button variant="ghost" size="icon" onClick={onNewChat} className="text-sidebar-foreground hover:bg-sidebar-accent">
          <PenSquare className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
          <Ticket className="h-5 w-5" />
        </Button>
        {currentChatBranches.length > 0 && (
          <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent">
            <GitBranch className="h-5 w-5" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <span className="text-sm font-bold text-primary">运</span>
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">运营大脑</span>
        <span className="ml-1 rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">Pro</span>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索对话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 bg-sidebar-accent/50 border-0"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-3 pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewChat}
          className="flex-1 justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <PenSquare className="h-4 w-4" />
          新对话
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        {mounted ? (
          <>
            {/* Current Chat Branches */}
            {currentChatBranches.length > 0 && (
          <Collapsible open={branchesOpen} onOpenChange={setBranchesOpen} className="mb-2">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <span className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  对话分支
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {currentChatBranches.length}
                  </Badge>
                </span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    branchesOpen && "rotate-90"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 pt-1">
              {currentChatBranches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => onSelectBranch?.(branch.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    currentBranchId === branch.id
                      ? "bg-primary/20 text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  <span className="flex-1 truncate" suppressHydrationWarning>{branch.name}</span>
                  {branch.isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  )}
                </button>
              ))}
            </CollapsibleContent>
            </Collapsible>
            )}

            {/* Tickets Section */}
            <Collapsible open={ticketsOpen} onOpenChange={setTicketsOpen} className="mb-2">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <span className="flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    工单
                    {selectedTickets.length > 0 && (
                      <Badge className="h-5 bg-primary px-1.5 text-xs text-primary-foreground">
                        {selectedTickets.length}
                      </Badge>
                    )}
                  </span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      ticketsOpen && "rotate-90"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      selectedTickets.includes(ticket.id)
                        ? "bg-primary/20 text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        ticket.status === "open" && "bg-green-500",
                        ticket.status === "pending" && "bg-yellow-500",
                        ticket.status === "closed" && "bg-muted-foreground"
                      )}
                    />
                    <span className="flex-1 truncate" suppressHydrationWarning>{ticket.title}</span>
                    {selectedTickets.includes(ticket.id) && (
                      <Pin className="h-3 w-3 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Chats Section */}
            <Collapsible open={chatsOpen} onOpenChange={setChatsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    对话记录
                  </span>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform",
                      chatsOpen && "rotate-90"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1">
                {filteredChats.map((chat) => {
                  const chatBranches = branches.filter(b => b.chatId === chat.id)
                  const isExpanded = expandedChatBranches.includes(chat.id)

                  return (
                    <div key={chat.id}>
                      <div
                        className={cn(
                          "group flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                          currentChatId === chat.id
                            ? "bg-sidebar-accent text-sidebar-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        {chatBranches.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleChatBranches(chat.id)
                            }}
                            className="shrink-0"
                          >
                            <ChevronRight
                              className={cn(
                                "h-3 w-3 transition-transform",
                                isExpanded && "rotate-90"
                              )}
                            />
                          </button>
                        )}
                        <button
                          onClick={() => onSelectChat(chat.id)}
                          className="flex-1 truncate text-left"
                          suppressHydrationWarning
                        >
                          {chat.title}
                        </button>
                        {chat.isStarred && (
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 shrink-0" />
                        )}
                        {chatBranches.length > 0 && !isExpanded && (
                          <Badge variant="outline" className="h-4 shrink-0 px-1 text-[10px]">
                            <GitBranch className="mr-0.5 h-2.5 w-2.5" />
                            {chatBranches.length}
                          </Badge>
                        )}
                        
                        {/* Actions dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onStarChat?.(chat.id)}>
                              <Star className="mr-2 h-4 w-4" />
                              {chat.isStarred ? "取消收藏" : "收藏"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onRenameChat?.(chat.id, chat.title)}>
                              <Edit3 className="mr-2 h-4 w-4" />
                              重命名
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Archive className="mr-2 h-4 w-4" />
                              归档
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-500 focus:text-red-500"
                              onClick={() => handleDeleteClick(chat.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Nested branches */}
                      {isExpanded && chatBranches.length > 0 && (
                        <div className="ml-6 mt-1 space-y-1 border-l border-border pl-2">
                          {chatBranches.map(branch => (
                            <button
                              key={branch.id}
                              onClick={() => onSelectBranch?.(branch.id)}
                              className={cn(
                                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                                currentBranchId === branch.id
                                  ? "bg-primary/20 text-primary"
                                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                              )}
                            >
                              <GitBranch className="h-3 w-3" />
                              <span className="truncate" suppressHydrationWarning>{branch.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CollapsibleContent>
            </Collapsible>
          </>
        ) : (
          <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
            加载中...
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Settings className="h-4 w-4" />
          设置与帮助
        </Button>
      </div>
    </div>
  )
}
