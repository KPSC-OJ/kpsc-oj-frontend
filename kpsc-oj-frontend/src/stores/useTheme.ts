import { useContext } from 'react'
import { ThemeContext, type ThemeContextValue } from './themeContext'

export function useTheme(): ThemeContextValue {
  const contextValue = useContext(ThemeContext)

  if (!contextValue) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return contextValue
}
