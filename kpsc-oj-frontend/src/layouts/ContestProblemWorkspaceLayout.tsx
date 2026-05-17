import { useState, type ReactElement } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'
import { ContestStatusBadge, ContestVisibilityBadge } from '../components/contest/ContestBadges'
import { ContestNavigation } from '../components/contest/ContestNavigation'
import { SiteHeader } from '../components/layout/SiteHeader'
import { useContest } from '../hooks/useContestData'

export function ContestProblemWorkspaceLayout(): ReactElement {
  const { contestId } = useParams()
  const [refreshKey, setRefreshKey] = useState(0)
  const { contest, errorMessage, isLoading } = useContest(contestId, refreshKey)

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-950">
        <SiteHeader />
        <main className="flex min-h-0 flex-1 items-center justify-center bg-white p-6">
          <p className="text-sm font-bold text-slate-500">대회 정보를 불러오는 중입니다.</p>
        </main>
      </div>
    )
  }

  if (!contest || !contestId) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-950">
        <SiteHeader />
        <main className="flex min-h-0 flex-1 items-center justify-center bg-white p-6">
          <h1 className="text-xl font-black text-slate-950">
            {errorMessage ?? '대회를 찾을 수 없습니다.'}
          </h1>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-950">
      <SiteHeader />

      <div className="shrink-0 border-b border-slate-800 bg-slate-950 px-4 py-3 text-white sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Link
              className="text-xs font-black uppercase text-blue-200 hover:text-white"
              to={`/contests/${contestId}/problems`}
            >
              Contest Problems
            </Link>
            <h1 className="mt-1 truncate text-lg font-black">{contest.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <ContestStatusBadge status={contest.status} />
            <ContestVisibilityBadge visibility={contest.visibility} />
          </div>
        </div>
      </div>

      <ContestNavigation contestId={contestId} isStaff={contest.isStaff} />

      <main className="flex min-h-0 flex-1 overflow-hidden bg-white">
        <Outlet
          context={{
            contest,
            contestId,
            refreshContest: () => setRefreshKey((currentRefreshKey) => currentRefreshKey + 1),
          }}
        />
      </main>
    </div>
  )
}
