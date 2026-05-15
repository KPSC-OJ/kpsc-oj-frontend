import { useState, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { ListPlus, UserCheck } from 'lucide-react'
import { Button, ButtonLink } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { ContestProblemStatusBadge } from '../components/contest/ContestBadges'
import { ContestScoreboardTable } from '../components/contest/ContestScoreboardTable'
import { getContestErrorMessage } from '../hooks/contestErrorMessage'
import { useContestLayoutContext } from '../layouts/contestLayoutContext'
import { useAuth } from '../stores/useAuth'
import {
  useContestProblems,
  useContestScoreboard,
  useJoinContest,
} from '../hooks/useContestData'

export function ContestHomePage(): ReactElement {
  const { contest, contestId, refreshContest } = useContestLayoutContext()
  const { isAuthenticated } = useAuth()
  const { problems } = useContestProblems(contestId)
  const { scoreboard } = useContestScoreboard(contestId)
  const { joinContestWithCurrentSession } = useJoinContest()
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  async function joinCurrentContest(): Promise<void> {
    setIsJoining(true)
    setJoinErrorMessage(null)

    try {
      await joinContestWithCurrentSession(contestId)
      refreshContest()
    } catch (error) {
      setJoinErrorMessage(getContestErrorMessage(error, '대회 참가 요청을 처리하지 못했습니다.'))
    } finally {
      setIsJoining(false)
    }
  }

  const previewScoreboard = scoreboard
    ? {
        ...scoreboard,
        rows: scoreboard.rows.slice(0, 5),
      }
    : null

  return (
    <div className="grid gap-5">
      {joinErrorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {joinErrorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black text-blue-600">Contest Home</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">{contest.title}</h2>
            </div>
            {contest.isStaff ? (
              <ButtonLink to={`/contests/${contestId}/manage/problems/new`} variant="secondary">
                <ListPlus size={16} />
                문제 생성
              </ButtonLink>
            ) : null}
          </div>
          <p className="text-sm leading-7 text-slate-600">{contest.description}</p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 p-3">
              <dt className="text-xs font-black uppercase text-slate-400">시작</dt>
              <dd className="mt-1 font-semibold text-slate-800">{contest.startTime}</dd>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <dt className="text-xs font-black uppercase text-slate-400">종료</dt>
              <dd className="mt-1 font-semibold text-slate-800">{contest.endTime}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <UserCheck className="text-blue-600" size={20} />
            <h2 className="text-lg font-black text-slate-950">내 참가 상태</h2>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-700">
            {contest.isParticipant ? '참가 중' : '아직 참가하지 않음'}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {contest.registrationMode === 'OPEN' ? 'OPEN' : 'STAFF_ONLY'}
          </p>
          <div className="mt-5">
            {contest.isParticipant ? (
              <ButtonLink to={`/contests/${contestId}/problems`}>문제 풀기</ButtonLink>
            ) : isAuthenticated ? (
              <Button disabled={isJoining} onClick={() => void joinCurrentContest()} type="button">
                {isJoining ? '참가 중' : '참가하기'}
              </Button>
            ) : (
              <ButtonLink to="/login">로그인 후 참가</ButtonLink>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">문제 목록 요약</h2>
            <p className="text-sm text-slate-500">ContestProblem 기준 풀이 상태를 표시합니다.</p>
          </div>
          <ButtonLink to={`/contests/${contestId}/problems`} variant="secondary">
            전체 보기
          </ButtonLink>
        </div>
        {problems.length > 0 ? (
          <div className="grid gap-2">
            {problems.slice(0, 5).map((problem) => (
              <Link
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 hover:border-blue-200 hover:bg-blue-50"
                key={problem.id}
                to={`/contests/${contestId}/problems/${problem.id}`}
              >
                <div>
                  <span className="mr-2 font-mono text-sm font-black text-slate-500">
                    {problem.label}
                  </span>
                  <span className="font-bold text-slate-900">{problem.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500">{problem.score}점</span>
                  <ContestProblemStatusBadge status={problem.solvedStatus} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm font-semibold text-slate-500">등록된 대회 문제가 없습니다.</p>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">스코어보드 미리보기</h2>
            <p className="text-sm text-slate-500">상위 5개 row를 표시합니다.</p>
          </div>
          <ButtonLink to={`/contests/${contestId}/scoreboard`} variant="secondary">
            스코어보드
          </ButtonLink>
        </div>
        {previewScoreboard && previewScoreboard.rows.length > 0 ? (
          <ContestScoreboardTable scoreboard={previewScoreboard} />
        ) : (
          <p className="text-sm font-semibold text-slate-500">아직 스코어보드 기록이 없습니다.</p>
        )}
      </Card>
    </div>
  )
}
