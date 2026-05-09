import { Link } from 'react-router-dom'
import type { ReactElement } from 'react'
import { Pencil } from 'lucide-react'
import { ButtonLink } from '../common/Button'
import type { ProblemListItem } from '../../types/problem'

type ProblemTableProps = {
  problems: ProblemListItem[]
}

export function ProblemTable({ problems }: ProblemTableProps): ReactElement {
  const hasEditableProblem = problems.some((problem) => problem.canEdit)

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">번호</th>
              <th className="px-4 py-3">제목</th>
              <th className="px-4 py-3">태그</th>
              <th className="px-4 py-3">시간 제한</th>
              <th className="px-4 py-3">메모리 제한</th>
              {hasEditableProblem ? <th className="px-4 py-3">관리</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {problems.map((problem) => (
              <tr className="hover:bg-slate-50" key={problem.problemNumber}>
                <td className="px-4 py-4 font-mono text-slate-500">
                  {problem.problemNumber}
                </td>
                <td className="px-4 py-4">
                  <Link
                    className="font-bold text-slate-950 hover:text-blue-700"
                    to={`/problems/${problem.problemNumber}/submit`}
                  >
                    {problem.title}
                  </Link>
                </td>
                <td className="px-4 py-4 text-slate-500">{problem.tag}</td>
                <td className="px-4 py-4 font-medium">{problem.timeLimitSeconds}s</td>
                <td className="px-4 py-4 font-medium">
                  {problem.memoryLimitMegabytes}MB
                </td>
                {hasEditableProblem ? (
                  <td className="px-4 py-4">
                    {problem.canEdit ? (
                      <ButtonLink
                        size="sm"
                        to={`/admin/problems/${problem.problemNumber}/edit`}
                        variant="secondary"
                      >
                        <Pencil size={15} />
                        수정
                      </ButtonLink>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
