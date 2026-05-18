import { useMemo, useState, type ReactElement } from 'react'
import { Lock, Radio, Search, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../components/common/Card'
import { ContestStatusBadge, ContestVisibilityBadge } from '../components/contest/ContestBadges'
import { useContestList } from '../hooks/useContestData'
import type { ContestListItem } from '../types/contest'
import type { ContestStatusDto, ContestVisibilityDto } from '../types/contestApi'

type ContestStatusFilter = ContestStatusDto | 'ALL'

const contestStatusFilterOptions: Array<{
  label: string
  value: ContestStatusFilter
}> = [
  { label: '전체 상태', value: 'ALL' },
  { label: '진행 중', value: 'RUNNING' },
  { label: '예정', value: 'SCHEDULED' },
  { label: '초안', value: 'DRAFT' },
  { label: '종료', value: 'ENDED' },
]

function getContestActionLabel(status: ContestStatusDto): string {
  if (status === 'RUNNING') {
    return '대회 입장'
  }

  if (status === 'ENDED') {
    return '결과 보기'
  }

  return '상세 보기'
}

function getContestRelativeStatusText(status: ContestStatusDto): string {
  if (status === 'RUNNING') {
    return '진행 중'
  }

  if (status === 'ENDED') {
    return '종료'
  }

  return '시작 전'
}

function getContestApprovalPolicyLabel(visibility: ContestVisibilityDto): string {
  return visibility === 'PRIVATE' ? '승인 필요' : '즉시 승인'
}

function ContestListCard({ contest }: { contest: ContestListItem }): ReactElement {
  return (
    <Link
      className="group block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
      to={`/contests/${contest.id}`}
    >
      <article>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ContestStatusBadge status={contest.status} />
            <ContestVisibilityBadge visibility={contest.visibility} />
          </div>
          <span className="text-xs font-black text-slate-400">
            {getContestApprovalPolicyLabel(contest.visibility)}
          </span>
        </div>

        <h3 className="text-xl font-black text-slate-950 group-hover:text-blue-700">
          {contest.title}
        </h3>
        <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-600">
          {contest.description}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="border-l-2 border-blue-100 pl-3">
            <dt className="text-xs font-black text-slate-400">시작</dt>
            <dd className="mt-1 font-bold text-slate-800">{contest.startTime}</dd>
          </div>
          <div className="border-l-2 border-slate-200 pl-3">
            <dt className="text-xs font-black text-slate-400">종료</dt>
            <dd className="mt-1 font-bold text-slate-800">{contest.endTime}</dd>
          </div>
        </dl>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            {contest.visibility === 'PRIVATE' ? <Lock size={14} /> : <Radio size={14} />}
            {getContestRelativeStatusText(contest.status)}
          </span>
          <span className="text-blue-600">{getContestActionLabel(contest.status)} -&gt;</span>
        </div>
      </article>
    </Link>
  )
}

export function ContestsPage(): ReactElement {
  const { contests, errorMessage, isLoading } = useContestList()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContestStatusFilter>('ALL')

  const contestStatusCounts = useMemo(
    () => ({
      ended: contests.filter((contest) => contest.status === 'ENDED').length,
      running: contests.filter((contest) => contest.status === 'RUNNING').length,
      scheduled: contests.filter(
        (contest) => contest.status === 'SCHEDULED' || contest.status === 'DRAFT',
      ).length,
    }),
    [contests],
  )

  const filteredContests = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase()

    return contests.filter((contest) => {
      const matchesStatus = statusFilter === 'ALL' || contest.status === statusFilter
      const matchesSearch =
        normalizedSearchTerm.length === 0 ||
        contest.title.toLowerCase().includes(normalizedSearchTerm) ||
        contest.description.toLowerCase().includes(normalizedSearchTerm)

      return matchesStatus && matchesSearch
    })
  }, [contests, searchTerm, statusFilter])

  return (
    <section className="grid gap-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="mb-4 inline-flex rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              대회
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              대회
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              진행 중인 대회와 예정된 라운드, 종료된 스코어보드를 한 곳에서 확인합니다.
            </p>
          </div>
          <div className="grid gap-3 text-center sm:min-w-[360px] sm:grid-cols-3">
            <div className="border-l-2 border-emerald-200 pl-4 text-left">
              <div className="text-2xl font-black text-slate-950">
                {contestStatusCounts.running}
              </div>
              <div className="mt-1 text-xs font-bold text-slate-500">진행 중</div>
            </div>
            <div className="border-l-2 border-amber-200 pl-4 text-left">
              <div className="text-2xl font-black text-slate-950">
                {contestStatusCounts.scheduled}
              </div>
              <div className="mt-1 text-xs font-bold text-slate-500">예정</div>
            </div>
            <div className="border-l-2 border-slate-200 pl-4 text-left">
              <div className="text-2xl font-black text-slate-950">
                {contestStatusCounts.ended}
              </div>
              <div className="mt-1 text-xs font-bold text-slate-500">종료</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-blue-600">대회 목록</p>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">대회 목록</h2>
        </div>
        <Trophy className="hidden text-blue-600 sm:block" size={28} />
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            className="w-full rounded-md border border-slate-200 bg-white px-10 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="대회 이름 검색"
            type="search"
            value={searchTerm}
          />
        </label>
        <select
          className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500"
          onChange={(event) => setStatusFilter(event.target.value as ContestStatusFilter)}
          value={statusFilter}
        >
          {contestStatusFilterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
      ) : filteredContests.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {filteredContests.map((contest) => (
            <ContestListCard contest={contest} key={contest.id} />
          ))}
        </div>
      ) : contests.length > 0 ? (
        <Card>
          <p className="text-sm font-semibold text-slate-700">조건에 맞는 대회가 없습니다.</p>
        </Card>
      ) : (
        <Card>
          <p className="text-sm font-semibold text-slate-700">등록된 대회가 없습니다.</p>
        </Card>
      )}
    </section>
  )
}
