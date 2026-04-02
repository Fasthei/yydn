"use client"

import { useState } from "react"
import { X, Search, Check, AlertCircle, Clock, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface Ticket {
  id: string
  title: string
  description: string
  status: "open" | "pending" | "closed"
  priority: "high" | "medium" | "low"
  createdAt: string
  assignee?: string
}

interface TicketPanelProps {
  tickets: Ticket[]
  selectedTicketIds: string[]
  onToggleTicket: (ticketId: string) => void
  onClose: () => void
  onConfirm: () => void
}

export function TicketPanel({
  tickets,
  selectedTicketIds,
  onToggleTicket,
  onClose,
  onConfirm,
}: TicketPanelProps) {
  const [search, setSearch] = useState("")

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.title.toLowerCase().includes(search.toLowerCase()) ||
      ticket.id.includes(search)
  )

  const getStatusIcon = (status: Ticket["status"]) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "closed":
        return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = (status: Ticket["status"]) => {
    switch (status) {
      case "open":
        return "进行中"
      case "pending":
        return "等待中"
      case "closed":
        return "已关闭"
    }
  }

  const getPriorityColor = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30"
    }
  }

  return (
    <div className="flex h-full w-80 flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="font-semibold text-foreground">选择工单</h3>
          <p className="text-xs text-muted-foreground">
            已选择 {selectedTicketIds.length} 个工单
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索工单..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted border-0"
          />
        </div>
      </div>

      {/* Ticket List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {filteredTickets.map((ticket) => {
            const isSelected = selectedTicketIds.includes(ticket.id)
            return (
              <button
                key={ticket.id}
                onClick={() => onToggleTicket(ticket.id)}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-all",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/50 hover:bg-muted"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        #{ticket.id}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", getPriorityColor(ticket.priority))}
                      >
                        {ticket.priority === "high"
                          ? "高"
                          : ticket.priority === "medium"
                            ? "中"
                            : "低"}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm text-foreground line-clamp-1">
                      {ticket.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      {getStatusIcon(ticket.status)}
                      <span className="text-xs text-muted-foreground">
                        {getStatusText(ticket.status)}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {ticket.createdAt}
                      </span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <Button onClick={onConfirm} className="w-full" disabled={selectedTicketIds.length === 0}>
          加载 {selectedTicketIds.length} 个工单到对话
        </Button>
      </div>
    </div>
  )
}
