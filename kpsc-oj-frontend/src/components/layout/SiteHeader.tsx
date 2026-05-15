import type { ReactElement } from 'react'
import { BookOpen, LogIn, LogOut } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { Button, ButtonLink } from '../common/Button'
import { useAuth } from '../../stores/useAuth'
import { ThemeModeToggle } from './ThemeModeToggle'

type HeaderNavigationItem = {
  adminOnly?: boolean
  label: string
  to: string
}

const navigationItems: HeaderNavigationItem[] = [
  { label: '문제', to: '/problems' },
  { label: '대회', to: '/contests' },
  { label: '제출', to: '/submissions' },
  { label: '랭킹', to: '/ranking' },
  { adminOnly: true, label: '출제', to: '/admin/problems/new' },
]

export function SiteHeader(): ReactElement {
  const { isAdmin, isAuthenticated, session, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3" to="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-600 text-sm font-black text-white">
            K
          </span>
          <span>
            <span className="block text-sm font-bold leading-4 text-slate-950">KPSC OJ</span>
            <span className="block text-xs text-slate-500">Kookmin Online Judge</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          {navigationItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <NavLink
                className={({ isActive }) =>
                  isActive ? 'text-blue-700' : 'hover:text-blue-700'
                }
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeModeToggle />
          {isAuthenticated && session ? (
            <>
              <span className="hidden rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 sm:inline">
                {session.serviceUsername}
              </span>
              <Button
                onClick={() => {
                  void signOut().catch(() => undefined)
                }}
                size="sm"
                variant="ghost"
              >
                <LogOut size={16} />
                로그아웃
              </Button>
            </>
          ) : (
            <ButtonLink size="sm" to="/login" variant="ghost">
              <LogIn size={16} />
              로그인
            </ButtonLink>
          )}
          <ButtonLink size="sm" to="/problems">
            <BookOpen size={16} />
            시작하기
          </ButtonLink>
        </div>
      </div>
    </header>
  )
}
