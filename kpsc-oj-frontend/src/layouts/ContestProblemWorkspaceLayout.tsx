import { useState, type ReactElement } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { useContest } from '../hooks/useContestData'
import { ContestSiteHeader } from './ContestSiteHeader'

export function ContestProblemWorkspaceLayout(): ReactElement {
  const { contestId } = useParams()
  const [refreshKey, setRefreshKey] = useState(0)
  const { contest, errorMessage, isLoading } = useContest(contestId, refreshKey)

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-950">
        <ContestSiteHeader contestId={contestId} />
        <main className="flex min-h-0 flex-1 items-center justify-center bg-white p-6">
          <p className="text-sm font-bold text-slate-500">대회 정보를 불러오는 중입니다.</p>
        </main>
      </div>
    )
  }

  if (!contest || !contestId) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-950">
        <ContestSiteHeader contestId={contestId} />
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
      <ContestSiteHeader contestId={contestId} />

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
