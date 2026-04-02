"use client"

import { Sparkles, FileText, Globe, Box, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuickAction {
  icon: React.ReactNode
  label: string
  description: string
  onClick?: () => void
}

interface WelcomeAreaProps {
  username: string
  onQuickAction?: (action: string) => void
}

export function WelcomeArea({ username, onQuickAction }: WelcomeAreaProps) {
  const quickActions: QuickAction[] = [
    {
      icon: <Globe className="h-5 w-5" />,
      label: "搜索信息",
      description: "联网搜索获取最新信息",
      onClick: () => onQuickAction?.("search"),
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: "生成文档",
      description: "创建报告、方案或总结",
      onClick: () => onQuickAction?.("document"),
    },
    {
      icon: <Box className="h-5 w-5" />,
      label: "沙盒测试",
      description: "在安全环境中执行代码",
      onClick: () => onQuickAction?.("sandbox"),
    },
    {
      icon: <Zap className="h-5 w-5" />,
      label: "分析工单",
      description: "加载工单进行智能分析",
      onClick: () => onQuickAction?.("ticket"),
    },
  ]

  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      {/* Greeting */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="text-lg text-muted-foreground">你好, {username}</span>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground text-balance">
          有什么可以帮到你？
        </h1>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            onClick={action.onClick}
            className="flex h-auto flex-col items-center gap-2 border-border bg-card p-4 hover:bg-muted hover:border-primary/50 transition-all group"
          >
            <div className="rounded-lg bg-muted p-2 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
              {action.icon}
            </div>
            <span className="text-sm font-medium text-foreground">{action.label}</span>
            <span className="text-xs text-muted-foreground text-center line-clamp-2">
              {action.description}
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}
