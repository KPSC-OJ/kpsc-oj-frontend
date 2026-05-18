import { useState, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock3, ListPlus, ShieldCheck, UserCheck, Users } from 'lucide-react'
import { Button, ButtonLink } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { ContestProblemStatusBadge } from '../components/contest/ContestBadges'
import { ContestScoreboardTable } from '../components/contest/ContestScoreboardTable'
import { getContestErrorMessage } from '../hooks/contestErrorMessage'
import { useContestLayoutContext } from '../layouts/contestLayoutContext'
import { useAuth } from '../stores/useAuth'
import {
  useContestParticipantApprovals,
  useContestProblems,
  useContestScoreboard,
  useJoinContest,
  usePendingContestParticipants,
} from '../hooks/useContestData'
import type { ContestDetail } from '../types/contest'

function getContestJoinPolicyText(contest: ContestDetail): string {
  if (contest.registrationMode === 'STAFF_ONLY') {
    return '운영진 전용'
  }

  if (contest.visibility === 'PRIVATE') {
    return '승인 필요'
  }

  return '즉시 승인'
}

function getJoinButtonLabel(contest: ContestDetail): string {
  if (contest.visibility === 'PRIVATE') {
    return '참가 신청'
  }

  return '참가하기'
}

export function ContestHomePage(): ReactElement {
  const { contest, contestId, refreshContest } = useContestLayoutContext()
  const { isAuthenticated } = useAuth()
  const { problems } = useContestProblems(contestId)
  const { scoreboard } = useContestScoreboard(contestId)
  const { joinContestWithCurrentSession } = useJoinContest()
  const { approveParticipantWithCurrentSession } = useContestParticipantApprovals()
  const [participantRefreshKey, setParticipantRefreshKey] = useState(0)
  const {
    errorMessage: pendingParticipantsErrorMessage,
    isLoading: isPendingParticipantsLoading,
    participants: pendingParticipants,
  } = usePendingContestParticipants(contestId, contest.isStaff, participantRefreshKey)
  const [approvalErrorMessage, setApprovalErrorMessage] = useState<string | null>(null)
  const [approvingParticipantId, setApprovingParticipantId] = useState<string | null>(null)
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null)
  const [joinNoticeMessage, setJoinNoticeMessage] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  async function joinCurrentContest(): Promise<void> {
    setIsJoining(true)
    setJoinErrorMessage(null)
    setJoinNoticeMessage(null)

    try {
      const joinResult = await joinContestWithCurrentSession(contestId)

      setJoinNoticeMessage(
        joinResult.participationStatus === 'PENDING'
          ? '참가 신청이 접수되었습니다. 운영진 승인 후 문제를 풀 수 있습니다.'
          : '대회 참가가 완료되었습니다.',
      )
      refreshContest()
    } catch (error) {
      setJoinErrorMessage(getContestErrorMessage(error, '대회 참가 요청을 처리하지 못했습니다.'))
    } finally {
      setIsJoining(false)
    }
  }

  async function approveParticipant(participantId: string): Promise<void> {
    setApprovingParticipantId(participantId)
    setApprovalErrorMessage(null)

    try {
      await approveParticipantWithCurrentSession(contestId, participantId)
      setParticipantRefreshKey((currentRefreshKey) => currentRefreshKey + 1)
    } catch (error) {
      setApprovalErrorMessage(
        getContestErrorMessage(error, '참가 신청을 승인하지 못했습니다.'),
      )
    } finally {
      setApprovingParticipantId(null)
    }
  }

  const canRequestParticipation = contest.registrationMode === 'OPEN' || contest.isStaff
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
      {joinNoticeMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {joinNoticeMessage}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black text-blue-600">대회 홈</p>
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
            참가 정책: {getContestJoinPolicyText(contest)}
          </p>
          <div className="mt-5">
            {contest.isParticipant ? (
              <ButtonLink to={`/contests/${contestId}/problems`}>문제 풀기</ButtonLink>
            ) : !canRequestParticipation ? (
              <p className="text-sm font-semibold text-slate-500">
                운영진만 참가할 수 있는 대회입니다.
              </p>
            ) : isAuthenticated ? (
              <Button disabled={isJoining} onClick={() => void joinCurrentContest()} type="button">
                {isJoining ? '처리 중' : getJoinButtonLabel(contest)}
              </Button>
            ) : (
              <ButtonLink to="/login">로그인 후 참가</ButtonLink>
            )}
          </div>
        </Card>
      </div>

      {contest.isStaff ? (
        <Card>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950">참가 승인 대기</h2>
                <p className="mt-1 text-sm text-slate-500">
                  승인 필요 대회의 참가 신청을 확인하고 승인합니다.
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm font-black text-slate-700">
              <Users size={16} />
              {pendingParticipants.length}명
            </div>
          </div>

          {approvalErrorMessage ? (
            <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {approvalErrorMessage}
            </div>
          ) : null}
          {pendingParticipantsErrorMessage ? (
            <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              {pendingParticipantsErrorMessage}
            </div>
          ) : null}

          {isPendingParticipantsLoading ? (
            <p className="text-sm font-semibold text-slate-500">
              참가 승인 대기 목록을 불러오는 중입니다.
            </p>
          ) : pendingParticipants.length > 0 ? (
            <div className="grid gap-2">
              {pendingParticipants.map((participant) => (
                <div
                  className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  key={participant.participantId}
                >
                  <div>
                    <div className="font-bold text-slate-900">{participant.serviceUsername}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={13} />
                        {participant.requestedAt}
                      </span>
                      <span>
                        {participant.status === 'PENDING' ? '승인 대기' : '승인됨'}
                      </span>
                    </div>
                  </div>
                  <Button
                    disabled={approvingParticipantId === participant.participantId}
                    onClick={() => void approveParticipant(participant.participantId)}
                    size="sm"
                    type="button"
                  >
                    <CheckCircle2 size={15} />
                    {approvingParticipantId === participant.participantId ? '승인 중' : '승인'}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-500">
              승인 대기 중인 참가 신청이 없습니다.
            </p>
          )}
        </Card>
      ) : null}

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
