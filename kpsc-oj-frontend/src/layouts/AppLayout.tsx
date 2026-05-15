import type { LucideIcon } from 'lucide-react'
import { BookOpen, ClipboardList, Medal, ShieldPlus, Trophy } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { useAuth } from '../stores/useAuth'

type AppNavigationItem = {
  adminOnly?: boolean
  icon: LucideIcon
  label: string
  to: string
}

const navigationItems: AppNavigationItem[] = [
  { icon: BookOpen, label: 'Problems', to: '/problems' },
  { icon: Medal, label: 'Contests', to: '/contests' },
  { icon: ClipboardList, label: 'Submissions', to: '/submissions' },
  { icon: Trophy, label: 'Ranking', to: '/ranking' },
  { adminOnly: true, icon: ShieldPlus, label: 'Admin', to: '/admin/problems/new' },
]

export function AppLayout() {
  const { isAdmin } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <SiteHeader />
      <div className="mx-auto grid w-full max-w-7xl flex-1 lg:grid-cols-[240px_1fr]">
        <aside className="hidden min-h-[calc(100vh-4rem)] border-r border-slate-200 bg-slate-50/80 p-4 lg:block">
          <div className="mb-4 px-3 text-xs font-bold uppercase text-slate-400">Menu</div>
          <nav className="space-y-1 text-sm font-semibold">
            {navigationItems.filter((item) => !item.adminOnly || isAdmin).map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-2 rounded-md px-3 py-2',
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-white hover:text-slate-950',
                    ].join(' ')
                  }
                  key={item.to}
                  to={item.to}
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}
