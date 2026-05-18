import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { SubmissionStatusBadge } from '../submission/SubmissionStatusBadge'
import type { ContestSubmission } from '../../types/contest'

type ContestSubmissionTableProps = {
  contestId: string
  showSubmitter: boolean
  submissions: ContestSubmission[]
}

function formatScore(scorePercentage: number | null): string {
  return scorePercentage === null ? '채점 전' : `${scorePercentage}%`
}

export function ContestSubmissionTable({
  contestId,
  showSubmitter,
  submissions,
}: ContestSubmissionTableProps): ReactElement {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">문제</th>
            {showSubmitter ? <th className="px-4 py-3">사용자</th> : null}
            <th className="px-4 py-3">언어</th>
            <th className="px-4 py-3">상태</th>
            <th className="px-4 py-3">점수</th>
            <th className="px-4 py-3">제출 시각</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {submissions.map((submission) => (
            <tr className="hover:bg-slate-50" key={submission.id}>
              <td className="px-4 py-3">
                <Link
                  className="font-black text-blue-700 hover:text-blue-900"
                  to={`/contests/${contestId}/problems/${submission.contestProblemId}`}
                >
                  {submission.problemLabel}
                </Link>
              </td>
              {showSubmitter ? (
                <td className="px-4 py-3 font-semibold text-slate-700">
                  {submission.submitterServiceUsername}
                </td>
              ) : null}
              <td className="px-4 py-3 font-mono text-xs text-slate-600">
                {submission.language}
              </td>
              <td className="px-4 py-3">
                <SubmissionStatusBadge status={submission.status} />
              </td>
              <td className="px-4 py-3 font-semibold text-slate-700">
                {formatScore(submission.scorePercentage)}
              </td>
              <td className="px-4 py-3 text-slate-500">{submission.submittedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
