"use client"

import * as React from "react"

interface RGB {
  r: number
  g: number
  b: number
}

type Theme = "light" | "dark" | "system" | "custom"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  customColor: RGB
  setCustomColor: (color: RGB) => void
  isDark: boolean
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system'
    }
    return 'system'
  })

  const [customColor, setCustomColor] = React.useState<RGB>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customColor')
      return saved ? JSON.parse(saved) : { r: 100, g: 100, b: 255 }
    }
    return { r: 100, g: 100, b: 255 }
  })

  const [isDark, setIsDark] = React.useState(false)

  // Handle system theme changes
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        setIsDark(mediaQuery.matches)
        document.documentElement.classList.toggle('dark', mediaQuery.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    handleChange() // Initial check

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Handle theme changes
  React.useEffect(() => {
    localStorage.setItem('theme', theme)
    
    if (theme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(systemDark)
      document.documentElement.classList.toggle('dark', systemDark)
    } else if (theme === 'dark') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    } else if (theme === 'custom') {
      document.documentElement.style.setProperty('--custom-r', customColor.r.toString())
      document.documentElement.style.setProperty('--custom-g', customColor.g.toString())
      document.documentElement.style.setProperty('--custom-b', customColor.b.toString())
    }
  }, [theme, customColor])

  // Save custom color changes
  React.useEffect(() => {
    localStorage.setItem('customColor', JSON.stringify(customColor))
    if (theme === 'custom') {
      document.documentElement.style.setProperty('--custom-r', customColor.r.toString())
      document.documentElement.style.setProperty('--custom-g', customColor.g.toString())
      document.documentElement.style.setProperty('--custom-b', customColor.b.toString())
    }
  }, [customColor, theme])

  const value = {
    theme,
    setTheme,
    customColor,
    setCustomColor,
    isDark,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
} 