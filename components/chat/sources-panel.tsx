"use client"

import { useState } from "react"
import { ExternalLink, Globe, Database, FileText, X, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export type SourceType = "web" | "kb" | "internal" | "all"

export interface Source {
  id: string
  type: "web" | "kb" | "internal"
  title: string
  url?: string
  snippet: string
  score: number
  domain?: string
  lastUpdated?: string
}

interface SourcesPanelProps {
  sources: Source[]
  isExpanded: boolean
  onToggleExpand: () => void
  onClose: () => void
  searchDepth: "quick" | "deep"
  searchSteps?: {
    step: string
    status: "completed" | "in-progress" | "pending"
    detail?: string
  }[]
}

export function SourcesPanel({
  sources,
  isExpanded,
  onToggleExpand,
  onClose,
  searchDepth,
  searchSteps = [],
}: SourcesPanelProps) {
  const [filter, setFilter] = useState<SourceType>("all")
  const [expandedSources, setExpandedSources] = useState<string[]>([])

  const filteredSources = filter === "all" 
    ? sources 
    : sources.filter(s => s.type === filter)

  const typeIcon = (type: Source["type"]) => {
    switch (type) {
      case "web": return <Globe className="h-3.5 w-3.5 text-blue-400" />
      case "kb": return <Database className="h-3.5 w-3.5 text-green-400" />
      case "internal": return <FileText className="h-3.5 w-3.5 text-orange-400" />
    }
  }

  const typeLabel = (type: Source["type"]) => {
    switch (type) {
      case "web": return "网络"
      case "kb": return "知识库"
      case "internal": return "内部"
    }
  }

  const toggleSourceExpand = (id: string) => {
    setExpandedSources(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const countByType = (type: SourceType) => {
    if (type === "all") return sources.length
    return sources.filter(s => s.type === type).length
  }

  return (
    <div className={cn(
      "flex flex-col border-l border-border bg-card transition-all duration-300",
      isExpanded ? "w-96" : "w-80"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-foreground">参考资料</h3>
          <Badge variant="secondary" className="text-xs">
            {sources.length} 条
          </Badge>
          {searchDepth === "deep" && (
            <Badge className="bg-primary/20 text-primary text-xs">深度搜索</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onToggleExpand}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Steps (for deep search) */}
      {searchDepth === "deep" && searchSteps.length > 0 && (
        <div className="border-b border-border px-4 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">搜索过程</p>
          <div className="space-y-2">
            {searchSteps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <div className={cn(
                  "mt-0.5 h-2 w-2 rounded-full shrink-0",
                  step.status === "completed" && "bg-green-500",
                  step.status === "in-progress" && "bg-blue-500 animate-pulse",
                  step.status === "pending" && "bg-muted-foreground"
                )} />
                <div>
                  <p className={cn(
                    step.status === "completed" ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.step}
                  </p>
                  {step.detail && (
                    <p className="text-muted-foreground">{step.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-border px-4 py-2">
        {(["all", "web", "kb", "internal"] as SourceType[]).map(type => (
          <Button
            key={type}
            variant={filter === type ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "h-7 px-2 text-xs",
              filter === type && "bg-primary/20 text-primary"
            )}
            onClick={() => setFilter(type)}
          >
            {type === "all" ? "全部" : typeLabel(type)}
            <span className="ml-1 text-muted-foreground">({countByType(type)})</span>
          </Button>
        ))}
      </div>

      {/* Sources List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-4">
          {filteredSources.map(source => (
            <div
              key={source.id}
              className="rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              {/* Source Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {typeIcon(source.type)}
                  <span className="text-sm font-medium text-foreground line-clamp-1">
                    {source.title}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className={cn(
                    "rounded px-1.5 py-0.5 text-xs font-medium",
                    source.score >= 0.8 && "bg-green-500/20 text-green-400",
                    source.score >= 0.5 && source.score < 0.8 && "bg-yellow-500/20 text-yellow-400",
                    source.score < 0.5 && "bg-red-500/20 text-red-400"
                  )}>
                    {Math.round(source.score * 100)}%
                  </span>
                </div>
              </div>

              {/* Domain/Meta */}
              {source.domain && (
                <p className="mt-1 text-xs text-muted-foreground">{source.domain}</p>
              )}

              {/* Snippet */}
              <p className={cn(
                "mt-2 text-xs text-muted-foreground",
                expandedSources.includes(source.id) ? "" : "line-clamp-2"
              )}>
                {source.snippet}
              </p>

              {/* Actions */}
              <div className="mt-2 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={() => toggleSourceExpand(source.id)}
                >
                  {expandedSources.includes(source.id) ? "收起" : "展开"}
                </Button>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    查看原文
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
