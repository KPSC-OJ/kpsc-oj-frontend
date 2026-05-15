import { useState, type ReactElement } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { Card } from '../components/common/Card'
import { ContestNavigation } from '../components/contest/ContestNavigation'
import { ContestStatusBadge, ContestVisibilityBadge } from '../components/contest/ContestBadges'
import { useContest } from '../hooks/useContestData'

export function ContestLayout(): ReactElement {
  const { contestId } = useParams()
  const [refreshKey, setRefreshKey] = useState(0)
  const { contest, errorMessage, isLoading } = useContest(contestId, refreshKey)

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm font-semibold text-slate-500">대회 정보를 불러오는 중입니다.</p>
      </Card>
    )
  }

  if (!contest || !contestId) {
    return (
      <Card>
        <h1 className="text-xl font-black text-slate-950">
          {errorMessage ?? '대회를 찾을 수 없습니다.'}
        </h1>
      </Card>
    )
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-950 px-5 py-5 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <ContestStatusBadge status={contest.status} />
              <ContestVisibilityBadge visibility={contest.visibility} />
            </div>
            <p className="text-xs font-black uppercase text-blue-200">Contest</p>
            <h1 className="mt-1 text-2xl font-black">{contest.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              {contest.description}
            </p>
          </div>
          <dl className="grid gap-2 text-sm font-semibold text-slate-200 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase text-slate-400">Start</dt>
              <dd>{contest.startTime}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">End</dt>
              <dd>{contest.endTime}</dd>
            </div>
          </dl>
        </div>
      </div>

      <ContestNavigation contestId={contestId} isStaff={contest.isStaff} />

      <div className="bg-slate-50 p-4 sm:p-5">
        <Outlet
          context={{
            contest,
            contestId,
            refreshContest: () => setRefreshKey((currentRefreshKey) => currentRefreshKey + 1),
          }}
        />
      </div>
    </section>
  )
}
