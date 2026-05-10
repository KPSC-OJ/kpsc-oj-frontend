import type { ReactElement } from 'react'
import { Button } from '../common/Button'
import type { SubmissionPage } from '../../types/submission'
import type { SubmissionLanguageDto } from '../../types/submissionApi'
import { SubmissionStatusBadge } from './SubmissionStatusBadge'

type ProblemSubmissionHistoryProps = {
  errorMessage: string | null
  isLoading: boolean
  onPageChange: (page: number) => void
  page: number
  submissionPage: SubmissionPage | null
}

const languageLabel: Record<SubmissionLanguageDto, string> = {
  cpp17: 'C++17',
  python3: 'Python 3',
}

function formatScore(scorePercentage: number | null): string {
  return scorePercentage === null ? '점수 산정 전' : `${scorePercentage}%`
}

function formatSubmittedAt(submittedAt: string): string {
  const submittedDate = new Date(submittedAt)

  if (Number.isNaN(submittedDate.getTime())) {
    return submittedAt
  }

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(submittedDate)
}

/** 제출 작업 화면 안에서 현재 문제로 필터링된 내 제출 목록을 표시한다. */
export function ProblemSubmissionHistory({
  errorMessage,
  isLoading,
  onPageChange,
  page,
  submissionPage,
}: ProblemSubmissionHistoryProps): ReactElement {
  if (errorMessage) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
        {errorMessage}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
        제출 기록을 불러오는 중입니다.
      </div>
    )
  }

  if (!submissionPage || submissionPage.submissions.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-5">
        <p className="text-sm font-bold text-slate-700">
          이 문제에 대한 제출 기록이 없습니다.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          코드를 제출하면 이곳에서 내 제출 기록을 확인할 수 있습니다.
        </p>
      </div>
    )
  }

  const totalPages = Math.max(submissionPage.totalPages, 1)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-950">내 제출 기록</h2>
        <p className="mt-1 text-sm text-slate-500">
          현재 문제에 제출한 기록을 최신순으로 표시합니다.
        </p>
      </div>

      <div className="space-y-3">
        {submissionPage.submissions.map((submission) => (
          <article
            className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
            key={submission.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SubmissionStatusBadge status={submission.status} />
              <span className="text-sm font-black text-slate-700">
                {formatScore(submission.scorePercentage)}
              </span>
            </div>

            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-black uppercase text-slate-400">언어</dt>
                <dd className="mt-1 font-semibold text-slate-700">
                  {languageLabel[submission.language]}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase text-slate-400">제출 시각</dt>
                <dd className="mt-1 font-semibold text-slate-700">
                  {formatSubmittedAt(submission.submittedAt)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-black uppercase text-slate-400">제출 ID</dt>
                <dd className="mt-1 truncate font-mono text-xs text-slate-500">
                  {submission.id}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          전체 {submissionPage.totalElements}개 · {submissionPage.page} / {totalPages} 페이지
        </p>
        <div className="flex gap-2">
          <Button
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            size="sm"
            type="button"
            variant="secondary"
          >
            이전
          </Button>
          <Button
            disabled={submissionPage.totalPages === 0 || page >= submissionPage.totalPages}
            onClick={() => onPageChange(page + 1)}
            size="sm"
            type="button"
            variant="secondary"
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  )
}
