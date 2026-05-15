import type { ReactElement } from 'react'
import { BarChart3, ClipboardList, Home, ListChecks, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'

type ContestNavigationProps = {
  contestId: string
  isStaff: boolean
}

const contestNavigationItems = [
  { icon: Home, label: 'Home', path: '' },
  { icon: ListChecks, label: 'Problems', path: 'problems' },
  { icon: ClipboardList, label: 'Submissions', path: 'submissions' },
  { icon: BarChart3, label: 'Scoreboard', path: 'scoreboard' },
]

export function ContestNavigation({
  contestId,
  isStaff,
}: ContestNavigationProps): ReactElement {
  const navigationItems = isStaff
    ? [...contestNavigationItems, { icon: Settings, label: 'Manage', path: 'manage/problems/new' }]
    : contestNavigationItems

  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4">
      {navigationItems.map((item) => {
        const Icon = item.icon
        const to = item.path ? `/contests/${contestId}/${item.path}` : `/contests/${contestId}`

        return (
          <NavLink
            className={({ isActive }) =>
              [
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
            <Icon size={16} />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
