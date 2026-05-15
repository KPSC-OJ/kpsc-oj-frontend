import { useState, type ReactElement } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { ContestScoreboardTable } from '../components/contest/ContestScoreboardTable'
import { useContestScoreboard } from '../hooks/useContestData'
import { useContestLayoutContext } from '../layouts/contestLayoutContext'

export function ContestScoreboardPage(): ReactElement {
  const { contestId } = useContestLayoutContext()
  const [refreshKey, setRefreshKey] = useState(0)
  const { errorMessage, isLoading, scoreboard } = useContestScoreboard(contestId, refreshKey)

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black text-blue-600">Scoreboard</p>
          <h2 className="text-xl font-black text-slate-950">대회 스코어보드</h2>
          <p className="mt-1 text-sm text-slate-500">
            ICPC 스타일 순위, penalty, 문제별 attempts를 표시합니다.
          </p>
        </div>
        <Button
          onClick={() => setRefreshKey((currentRefreshKey) => currentRefreshKey + 1)}
          type="button"
          variant="secondary"
        >
          <RefreshCw size={16} />
          새로고침
        </Button>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <Card>
          <p className="text-sm font-semibold text-slate-500">스코어보드를 불러오는 중입니다.</p>
        </Card>
      ) : scoreboard && scoreboard.rows.length > 0 ? (
        <ContestScoreboardTable scoreboard={scoreboard} />
      ) : (
        <Card>
          <p className="text-sm font-semibold text-slate-500">아직 스코어보드 기록이 없습니다.</p>
        </Card>
      )}
    </div>
  )
}
