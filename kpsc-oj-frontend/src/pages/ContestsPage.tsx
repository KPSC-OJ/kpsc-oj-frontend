import type { ReactElement } from 'react'
import { CalendarDays, Lock, Radio, Trophy } from 'lucide-react'
import { ButtonLink } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { ContestStatusBadge, ContestVisibilityBadge } from '../components/contest/ContestBadges'
import { useContestList } from '../hooks/useContestData'
import type { ContestListItem } from '../types/contest'
import type { ContestStatusDto } from '../types/contestApi'

const contestStatusGroups: Array<{
  description: string
  statuses: ContestStatusDto[]
  title: string
}> = [
  { description: '참가와 제출이 가능한 대회', statuses: ['RUNNING'], title: '진행중' },
  { description: '시작 시간이 예정된 대회', statuses: ['SCHEDULED', 'DRAFT'], title: '예정' },
  { description: '스코어보드와 제출 기록을 확인할 수 있는 대회', statuses: ['ENDED'], title: '종료' },
]

function ContestListCard({ contest }: { contest: ContestListItem }): ReactElement {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ContestStatusBadge status={contest.status} />
        <ContestVisibilityBadge visibility={contest.visibility} />
      </div>
      <h3 className="text-lg font-black text-slate-950">{contest.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{contest.description}</p>
      <dl className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} />
          <span>{contest.startTime}</span>
        </div>
        <div className="flex items-center gap-2">
          {contest.visibility === 'PRIVATE' ? <Lock size={16} /> : <Radio size={16} />}
          <span>{contest.endTime}</span>
        </div>
      </dl>
      <div className="mt-5">
        <ButtonLink to={`/contests/${contest.id}`} variant="secondary">
          대회 입장
        </ButtonLink>
      </div>
    </article>
  )
}

export function ContestsPage(): ReactElement {
  const { contests, errorMessage, isLoading } = useContestList()

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-blue-600">Contests</p>
          <h1 className="text-2xl font-black text-slate-950">대회 목록</h1>
          <p className="mt-1 text-sm text-slate-500">
            예정, 진행중, 종료된 KPSC 대회를 확인합니다.
          </p>
        </div>
        <Trophy className="text-blue-600" size={28} />
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <Card>
          <p className="text-sm font-semibold text-slate-500">대회 목록을 불러오는 중입니다.</p>
        </Card>
      ) : contests.length > 0 ? (
        <div className="grid gap-6">
          {contestStatusGroups.map((group) => {
            const groupContests = contests.filter((contest) =>
              group.statuses.includes(contest.status),
            )

            return (
              <section className="grid gap-3" key={group.title}>
                <div>
                  <h2 className="text-lg font-black text-slate-950">{group.title}</h2>
                  <p className="text-sm text-slate-500">{group.description}</p>
                </div>
                {groupContests.length > 0 ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {groupContests.map((contest) => (
                      <ContestListCard contest={contest} key={contest.id} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-sm font-semibold text-slate-500">
                    표시할 대회가 없습니다.
                  </div>
                )}
              </section>
            )
          })}
        </div>
      ) : (
        <Card>
          <p className="text-sm font-semibold text-slate-700">등록된 대회가 없습니다.</p>
        </Card>
      )}
    </section>
  )
}
