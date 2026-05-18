import { useState, type ReactElement } from 'react'
import { Edit3, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, ButtonLink } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { ContestProblemStatusBadge } from '../components/contest/ContestBadges'
import { getContestErrorMessage } from '../hooks/contestErrorMessage'
import { useContestProblemMutations, useContestProblems } from '../hooks/useContestData'
import { useContestLayoutContext } from '../layouts/contestLayoutContext'

export function ContestProblemsPage(): ReactElement {
  const { contest, contestId } = useContestLayoutContext()
  const [refreshKey, setRefreshKey] = useState(0)
  const { deleteProblemWithCurrentSession } = useContestProblemMutations()
  const { errorMessage, isLoading, problems } = useContestProblems(contestId, refreshKey)
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null)

  async function deleteProblem(contestProblemId: string): Promise<void> {
    const confirmed = window.confirm(
      '대회 문제를 삭제합니다. 기존 제출이 연결된 문제는 삭제에 실패할 수 있습니다.',
    )

    if (!confirmed) {
      return
    }

    setMutationErrorMessage(null)

    try {
      await deleteProblemWithCurrentSession(contestId, contestProblemId)
      setRefreshKey((currentRefreshKey) => currentRefreshKey + 1)
    } catch (error) {
      setMutationErrorMessage(getContestErrorMessage(error, '대회 문제를 삭제하지 못했습니다.'))
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black text-blue-600">대회 문제</p>
          <h2 className="text-xl font-black text-slate-950">대회 문제 목록</h2>
        </div>
        {contest.isStaff ? (
          <ButtonLink to={`/contests/${contestId}/manage/problems/new`} variant="secondary">
            <Plus size={16} />
            문제 생성
          </ButtonLink>
        ) : null}
      </div>

      {errorMessage || mutationErrorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {mutationErrorMessage ?? errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <Card>
          <p className="text-sm font-semibold text-slate-500">대회 문제를 불러오는 중입니다.</p>
        </Card>
      ) : problems.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">번호</th>
                <th className="px-4 py-3">제목</th>
                <th className="px-4 py-3">점수</th>
                <th className="px-4 py-3">상태</th>
                {contest.isStaff ? <th className="px-4 py-3 text-right">관리</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {problems.map((problem) => (
                <tr className="hover:bg-slate-50" key={problem.id}>
                  <td className="px-4 py-4 font-mono text-slate-500">{problem.label}</td>
                  <td className="px-4 py-4">
                    <Link
                      className="font-black text-slate-950 hover:text-blue-700"
                      to={`/contests/${contestId}/problems/${problem.id}`}
                    >
                      {problem.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{problem.score}</td>
                  <td className="px-4 py-4">
                    <ContestProblemStatusBadge status={problem.solvedStatus} />
                  </td>
                  {contest.isStaff ? (
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <ButtonLink
                          size="sm"
                          to={`/contests/${contestId}/manage/problems/${problem.id}/edit`}
                          variant="secondary"
                        >
                          <Edit3 size={14} />
                          수정
                        </ButtonLink>
                        <Button
                          onClick={() => void deleteProblem(problem.id)}
                          size="sm"
                          type="button"
                          variant="danger"
                        >
                          <Trash2 size={14} />
                          삭제
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card>
          <p className="text-sm font-semibold text-slate-500">등록된 대회 문제가 없습니다.</p>
        </Card>
      )}
    </div>
  )
}
