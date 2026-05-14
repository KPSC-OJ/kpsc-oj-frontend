import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { ThemeContext, type ThemeContextValue, type ThemeMode } from './themeContext'

type ThemeProviderProps = {
  children: ReactNode
}

const themeStorageKey = 'kpsc_oj_theme_mode'

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

function getPreferredThemeMode(): ThemeMode {
  const storedThemeMode = window.localStorage.getItem(themeStorageKey)

  if (isThemeMode(storedThemeMode)) {
    return storedThemeMode
  }

  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

function applyThemeMode(themeMode: ThemeMode): void {
  document.documentElement.dataset.theme = themeMode
  document.documentElement.classList.toggle('dark', themeMode === 'dark')
  document.documentElement.style.colorScheme = themeMode
}

/** UI 색상 모드를 localStorage에 저장하고 document theme attribute에 반영한다. */
export function ThemeProvider({ children }: ThemeProviderProps): ReactElement {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getPreferredThemeMode())

  useEffect(() => {
    applyThemeMode(themeMode)
    window.localStorage.setItem(themeStorageKey, themeMode)
  }, [themeMode])

  const toggleThemeMode = useCallback((): void => {
    setThemeMode((currentThemeMode) =>
      currentThemeMode === 'dark' ? 'light' : 'dark',
    )
  }, [])

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      isDarkMode: themeMode === 'dark',
      setThemeMode,
      themeMode,
      toggleThemeMode,
    }),
    [themeMode, toggleThemeMode],
  )

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}
