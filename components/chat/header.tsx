"use client"

import { Menu, Ticket, ArrowLeft, User, Sun, Moon, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"
import { useColorTheme } from "@/components/color-theme-provider"
import { colorSchemeLabels } from "@/lib/themes"
import type { ColorScheme } from "@/lib/themes"

interface HeaderProps {
  onToggleSidebar: () => void
  onToggleTicketPanel: () => void
  onReturnToSystem?: () => void
  showTicketPanel: boolean
  selectedTicketsCount: number
  username: string
  children?: React.ReactNode
}

export function Header({
  onToggleSidebar,
  onToggleTicketPanel,
  onReturnToSystem,
  showTicketPanel,
  selectedTicketsCount,
  username,
  children,
}: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { colorScheme, setColorScheme } = useColorTheme()

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {onReturnToSystem && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReturnToSystem}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            返回工单系统
          </Button>
        )}
      </div>

      {/* Center area for branch selector and other controls */}
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Color Scheme Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              aria-label="选择主题色"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(["blue", "purple", "green", "orange", "red"] as ColorScheme[]).map((scheme) => (
              <DropdownMenuItem
                key={scheme}
                onClick={() => setColorScheme(scheme)}
                className="cursor-pointer"
              >
                <div
                  className="h-3 w-3 rounded-full mr-2"
                  style={{
                    backgroundColor:
                      scheme === "blue"
                        ? "hsl(250, 100%, 55%)"
                        : scheme === "purple"
                          ? "hsl(280, 100%, 58%)"
                          : scheme === "green"
                            ? "hsl(140, 100%, 58%)"
                            : scheme === "orange"
                              ? "hsl(40, 100%, 62%)"
                              : "hsl(15, 100%, 55%)",
                  }}
                />
                {colorSchemeLabels[scheme]}
                {colorScheme === scheme && <span className="ml-2">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="切换主题"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Ticket Button */}
        <Button
          variant={showTicketPanel ? "secondary" : "outline"}
          size="sm"
          onClick={onToggleTicketPanel}
          className="gap-2"
        >
          <Ticket className="h-4 w-4" />
          工单
          {selectedTicketsCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              {selectedTicketsCount}
            </span>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{username}</p>
              <p className="text-xs text-muted-foreground">{username}@company.com</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              个人设置
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
