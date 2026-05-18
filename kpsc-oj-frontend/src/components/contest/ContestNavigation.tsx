import type { ReactElement } from 'react'
import { BarChart3, ClipboardList, Home, ListChecks, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

type ContestNavigationProps = {
  contestId: string
  includeManage?: boolean
  isStaff?: boolean
  variant?: 'header' | 'standalone'
}

const contestNavigationItems = [
  { icon: Home, label: '홈', path: '' },
  { icon: ListChecks, label: '문제', path: 'problems' },
  { icon: ClipboardList, label: '제출', path: 'submissions' },
  { icon: BarChart3, label: '스코어보드', path: 'scoreboard' },
]

export function ContestNavigation({
  contestId,
  includeManage = false,
  isStaff = false,
  variant = 'standalone',
}: ContestNavigationProps): ReactElement {
  const navigationItems = includeManage && isStaff
    ? [...contestNavigationItems, { icon: Settings, label: '관리', path: 'manage/problems/new' }]
    : contestNavigationItems
  const isHeaderNavigation = variant === 'header'

  return (
    <nav
      className={
        isHeaderNavigation
          ? 'hidden items-center justify-center gap-6 text-sm font-semibold text-slate-600 md:flex'
          : 'flex justify-center gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4'
      }
    >
      {navigationItems.map((item) => {
        const Icon = item.icon
        const to = item.path ? `/contests/${contestId}/${item.path}` : `/contests/${contestId}`

        return (
          <NavLink
            className={({ isActive }) =>
              isHeaderNavigation
                ? isActive
                  ? 'text-blue-700'
                  : 'hover:text-blue-700'
                : [
                    'inline-flex shrink-0 items-center gap-2 border-b-2 px-2 py-3 text-sm font-bold transition',
                    isActive
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-950',
                  ].join(' ')
            }
            end={!item.path}
            key={item.path || 'home'}
            to={to}
          >
            {isHeaderNavigation ? null : <Icon size={16} />}
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
