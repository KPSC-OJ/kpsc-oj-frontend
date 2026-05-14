import type { ReactElement } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../stores/useTheme'

/** 전역 UI 색상 모드를 전환하는 Header 전용 컨트롤이다. */
export function ThemeModeToggle(): ReactElement {
  const { isDarkMode, toggleThemeMode } = useTheme()
  const label = isDarkMode ? '화이트 모드로 변경' : '다크 모드로 변경'

  return (
    <button
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      onClick={toggleThemeMode}
      title={label}
      type="button"
    >
      {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
