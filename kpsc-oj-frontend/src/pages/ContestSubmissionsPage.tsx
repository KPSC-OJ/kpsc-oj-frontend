import { useState, type ReactElement } from 'react'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { ContestSubmissionTable } from '../components/contest/ContestSubmissionTable'
import { useContestSubmissions } from '../hooks/useContestData'
import { useContestLayoutContext } from '../layouts/contestLayoutContext'

type SubmissionScope = 'all' | 'mine'

export function ContestSubmissionsPage(): ReactElement {
  const { contest, contestId } = useContestLayoutContext()
  const [scope, setScope] = useState<SubmissionScope>('mine')
  const { errorMessage, isLoading, isPolling, submissions } = useContestSubmissions(
    contestId,
    scope,
    0,
    true,
  )

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black text-blue-600">Submissions</p>
          <h2 className="text-xl font-black text-slate-950">대회 제출 목록</h2>
          {isPolling ? (
            <p className="mt-1 text-sm font-semibold text-slate-500">채점 상태를 갱신 중입니다.</p>
          ) : null}
        </div>
        {contest.isStaff ? (
          <div className="flex gap-2">
            <Button
              onClick={() => setScope('mine')}
              type="button"
              variant={scope === 'mine' ? 'primary' : 'secondary'}
            >
              내 제출
            </Button>
            <Button
              onClick={() => setScope('all')}
              type="button"
              variant={scope === 'all' ? 'primary' : 'secondary'}
            >
              전체 제출
            </Button>
          </div>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <Card>
          <p className="text-sm font-semibold text-slate-500">제출 목록을 불러오는 중입니다.</p>
        </Card>
      ) : submissions.length > 0 ? (
        <ContestSubmissionTable
          contestId={contestId}
          showSubmitter={scope === 'all'}
          submissions={submissions}
        />
      ) : (
        <Card>
          <p className="text-sm font-semibold text-slate-500">표시할 제출 기록이 없습니다.</p>
        </Card>
      )}
    </div>
  )
}
