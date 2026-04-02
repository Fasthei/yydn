"use client"

import { useState } from "react"
import {
  X,
  Maximize2,
  Minimize2,
  Save,
  Download,
  Copy,
  Undo,
  Redo,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Code,
  Link,
  Image,
  Quote,
  Sparkles,
  ChevronRight,
  FileText,
  Check,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DocumentVersion {
  id: string
  timestamp: string
  label: string
}

interface DocumentWorkspaceProps {
  isVisible: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onClose: () => void
  title: string
  content: string
  onTitleChange: (title: string) => void
  onContentChange: (content: string) => void
  onSave: () => void
  onExport: (format: "md" | "docx" | "pdf") => void
  versions?: DocumentVersion[]
  isGenerating?: boolean
  isSaving?: boolean
}

export function DocumentWorkspace({
  isVisible,
  isExpanded,
  onToggleExpand,
  onClose,
  title,
  content,
  onTitleChange,
  onContentChange,
  onSave,
  onExport,
  versions = [],
  isGenerating = false,
  isSaving = false,
}: DocumentWorkspaceProps) {
  const [showVersions, setShowVersions] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [showAiPanel, setShowAiPanel] = useState(false)

  if (!isVisible) return null

  const toolbarButtons = [
    { icon: Bold, label: "加粗", action: () => insertMarkdown("**", "**") },
    { icon: Italic, label: "斜体", action: () => insertMarkdown("*", "*") },
    { icon: Heading1, label: "标题1", action: () => insertMarkdown("# ", "") },
    { icon: Heading2, label: "标题2", action: () => insertMarkdown("## ", "") },
    { icon: List, label: "无序列表", action: () => insertMarkdown("- ", "") },
    { icon: ListOrdered, label: "有序列表", action: () => insertMarkdown("1. ", "") },
    { icon: Quote, label: "引用", action: () => insertMarkdown("> ", "") },
    { icon: Code, label: "代码", action: () => insertMarkdown("`", "`") },
    { icon: Link, label: "链接", action: () => insertMarkdown("[", "](url)") },
  ]

  function insertMarkdown(before: string, after: string) {
    // In a real implementation, this would insert at cursor position
    onContentChange(content + before + "文本" + after)
  }

  const aiActions = [
    { label: "润色文字", prompt: "请帮我润色以下文字，使其更加专业流畅：" },
    { label: "扩展内容", prompt: "请帮我扩展以下内容，添加更多细节：" },
    { label: "精简压缩", prompt: "请帮我精简以下内容，保留核心要点：" },
    { label: "修正语法", prompt: "请帮我修正以下文字的语法错误：" },
    { label: "翻译英文", prompt: "请将以下内容翻译为英文：" },
  ]

  return (
    <div className={cn(
      "fixed right-0 top-0 bottom-0 z-40 flex flex-col border-l border-border bg-card transition-all duration-300 ease-out",
      isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none",
      isExpanded ? "w-full" : "w-[500px]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-foreground">文档工作区</h3>
          {isGenerating && (
            <Badge className="bg-blue-500/20 text-blue-400 text-xs">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              生成中
            </Badge>
          )}
          {isSaving && (
            <Badge className="bg-green-500/20 text-green-400 text-xs">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              保存中
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 gap-1 text-xs"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            保存
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Download className="h-3 w-3" />
                导出
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onExport("md")}>
                Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("docx")}>
                Word (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("pdf")}>
                PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleExpand} title={isExpanded ? "最小化" : "最大化"}>
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="关闭">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Title Input */}
      <div className="border-b border-border px-4 py-3 flex-shrink-0">
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="文档标题"
          className="border-0 bg-transparent text-lg font-semibold focus-visible:ring-0 px-0"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        <Separator orientation="vertical" className="mx-2 h-5" />
        <div className="flex items-center gap-1">
          {toolbarButtons.map((btn, idx) => (
            <Button
              key={idx}
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={btn.action}
              title={btn.label}
            >
              <btn.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <Separator orientation="vertical" className="mx-2 h-5" />
        <Button
          variant={showAiPanel ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "h-7 gap-1 text-xs",
            showAiPanel && "bg-primary/20 text-primary"
          )}
          onClick={() => setShowAiPanel(!showAiPanel)}
        >
          <Sparkles className="h-3 w-3" />
          AI 润色
        </Button>
      </div>

      {/* AI Panel */}
      {showAiPanel && (
        <div className="border-b border-border bg-muted/30 p-3 flex-shrink-0">
          <div className="mb-2 flex flex-wrap gap-1">
            {aiActions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setAiPrompt(action.prompt)}
              >
                {action.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="输入 AI 指令，如：帮我优化这段文字..."
              className="h-8 text-sm"
            />
            <Button size="sm" className="h-8 flex-shrink-0">
              <Sparkles className="mr-1 h-3 w-3" />
              执行
            </Button>
          </div>
        </div>
      )}

      {/* Version History Toggle */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2 flex-shrink-0">
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setShowVersions(!showVersions)}
        >
          <ChevronRight className={cn(
            "h-3 w-3 transition-transform",
            showVersions && "rotate-90"
          )} />
          版本历史 ({versions.length})
        </button>
        {versions.length > 0 && (
          <span className="text-xs text-muted-foreground">
            最近保存: {versions[0]?.timestamp}
          </span>
        )}
      </div>

      {/* Version List */}
      {showVersions && versions.length > 0 && (
        <div className="max-h-32 overflow-y-auto border-b border-border bg-muted/20 flex-shrink-0">
          {versions.map(version => (
            <button
              key={version.id}
              className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="text-sm">{version.label}</span>
              <span className="text-xs text-muted-foreground">{version.timestamp}</span>
            </button>
          ))}
        </div>
      )}

      {/* Editor */}
      <ScrollArea className="flex-1 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="开始编写文档内容..."
          className="h-full min-h-full w-full resize-none bg-transparent p-4 text-sm leading-relaxed focus:outline-none"
          disabled={isGenerating}
        />
      </ScrollArea>

      {/* Footer Stats */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground flex-shrink-0">
        <span>字数: {content.length}</span>
        <span>预计阅读: {Math.ceil(content.length / 400)} 分钟</span>
      </div>
    </div>
  )
}
