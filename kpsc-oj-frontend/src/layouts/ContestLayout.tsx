import { useState, type ReactElement } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { ContestStatusBadge, ContestVisibilityBadge } from '../components/contest/ContestBadges'
import { SiteFooter } from '../components/layout/SiteFooter'
import { useContest } from '../hooks/useContestData'
import { ContestSiteHeader } from './ContestSiteHeader'

export function ContestLayout(): ReactElement {
  const { contestId } = useParams()
  const [refreshKey, setRefreshKey] = useState(0)
  const { contest, errorMessage, isLoading } = useContest(contestId, refreshKey)

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
        <ContestSiteHeader contestId={contestId} />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <p className="text-sm font-semibold text-slate-500">대회 정보를 불러오는 중입니다.</p>
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (!contest || !contestId) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
        <ContestSiteHeader contestId={contestId} />
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <h1 className="text-xl font-black text-slate-950">
            {errorMessage ?? '대회를 찾을 수 없습니다.'}
          </h1>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <ContestSiteHeader contestId={contestId} />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-5 flex justify-end">
            <div className="flex flex-wrap gap-2">
              <ContestStatusBadge status={contest.status} />
              <ContestVisibilityBadge visibility={contest.visibility} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {contest.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                {contest.description}
              </p>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
              <div className="text-xs font-black text-blue-700">대회 시간</div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs font-bold text-slate-500">시작</dt>
                  <dd className="mt-1 font-black text-slate-950">{contest.startTime}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-slate-500">종료</dt>
                  <dd className="mt-1 font-black text-slate-950">{contest.endTime}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet
          context={{
            contest,
            contestId,
            refreshContest: () => setRefreshKey((currentRefreshKey) => currentRefreshKey + 1),
          }}
        />
      </main>

      <SiteFooter />
    </div>
  )
}
