import { createContext } from 'react'

export type ThemeMode = 'light' | 'dark'

export type ThemeContextValue = {
  isDarkMode: boolean
  setThemeMode: (themeMode: ThemeMode) => void
  themeMode: ThemeMode
  toggleThemeMode: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
