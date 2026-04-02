'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { ColorScheme } from '@/lib/themes'
import { colorSchemes } from '@/lib/themes'

interface ColorThemeContextType {
  colorScheme: ColorScheme
  setColorScheme: (scheme: ColorScheme) => void
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(
  undefined
)

export function ColorThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('blue')
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('colorScheme') as ColorScheme | null
    if (stored) {
      setColorScheme(stored)
      applyColorScheme(stored)
    } else {
      applyColorScheme('blue')
    }
    setMounted(true)
  }, [])

  const handleSetColorScheme = (scheme: ColorScheme) => {
    setColorScheme(scheme)
    localStorage.setItem('colorScheme', scheme)
    applyColorScheme(scheme)
  }

  return (
    <ColorThemeContext.Provider
      value={{ colorScheme, setColorScheme: handleSetColorScheme }}
    >
      {mounted && children}
    </ColorThemeContext.Provider>
  )
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext)
  if (!context) {
    throw new Error('useColorTheme must be used within ColorThemeProvider')
  }
  return context
}

function applyColorScheme(scheme: ColorScheme) {
  const colors = colorSchemes[scheme]
  const html = document.documentElement
  
  Object.entries(colors).forEach(([key, value]) => {
    html.style.setProperty(`--${key}`, value)
  })
}
