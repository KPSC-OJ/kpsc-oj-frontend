import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { SubmissionStatusBadge } from '../components/submission/SubmissionStatusBadge'
import { useMySubmissions } from '../hooks/useMySubmissions'
import type { SubmissionLanguageDto } from '../types/submissionApi'

const languageLabel: Record<SubmissionLanguageDto, string> = {
  cpp17: 'C++17',
  python3: 'Python 3',
}

function formatScore(scorePercentage: number | null): string {
  return scorePercentage === null ? '-' : `${scorePercentage}%`
}

export function SubmissionsPage() {
  const [page, setPage] = useState(1)
  const { errorMessage, isLoading, submissionPage } = useMySubmissions(page)

  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-bold text-blue-600">Submissions</p>
        <h1 className="text-2xl font-black text-slate-950">내 제출</h1>
        <p className="mt-1 text-sm text-slate-500">
          백엔드에 저장된 내 제출 상태와 점수를 확인합니다.
        </p>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <Card>
          <p className="text-sm font-semibold text-slate-500">제출 목록을 불러오는 중입니다.</p>
        </Card>
      ) : submissionPage && submissionPage.submissions.length > 0 ? (
        <>
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">제출 ID</th>
                    <th className="px-4 py-3">문제</th>
                    <th className="px-4 py-3">언어</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3">점수</th>
                    <th className="px-4 py-3">제출 시각</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissionPage.submissions.map((submission) => (
                    <tr className="hover:bg-slate-50" key={submission.id}>
                      <td className="px-4 py-4 font-mono text-slate-500">{submission.id}</td>
                      <td className="px-4 py-4">
                        <Link
                          className="font-bold text-slate-950 hover:text-blue-700"
                          to={`/problems/${submission.problemNumber}/submit`}
                        >
                          {submission.problemNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {languageLabel[submission.language]}
                      </td>
                      <td className="px-4 py-4">
                        <SubmissionStatusBadge status={submission.status} />
                      </td>
                      <td className="px-4 py-4 font-medium">
                        {formatScore(submission.scorePercentage)}
                      </td>
                      <td className="px-4 py-4 text-slate-500">{submission.submittedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              전체 {submissionPage.totalElements}개 · {submissionPage.page} /{' '}
              {Math.max(submissionPage.totalPages, 1)} 페이지
            </p>
            <div className="flex gap-2">
              <Button
                disabled={page <= 1}
                onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
                type="button"
                variant="secondary"
              >
                이전
              </Button>
              <Button
                disabled={submissionPage.totalPages === 0 || page >= submissionPage.totalPages}
                onClick={() => setPage((currentPage) => currentPage + 1)}
                type="button"
                variant="secondary"
              >
                다음
              </Button>
            </div>
          </div>
        </>
      ) : (
        <Card>
          <p className="text-sm font-semibold text-slate-700">아직 제출 기록이 없습니다.</p>
        </Card>
      )}
    </section>
  )
}
