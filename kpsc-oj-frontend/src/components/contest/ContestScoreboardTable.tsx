import type { ReactElement } from 'react'
import type { ContestScoreboard, ContestScoreboardCell } from '../../types/contest'

function getCellClassName(cell: ContestScoreboardCell | undefined): string {
  if (!cell) {
    return 'bg-white text-slate-400'
  }

  if (cell.solved) {
    return cell.firstSolved
      ? 'bg-emerald-100 text-emerald-900 ring-1 ring-inset ring-emerald-300'
      : 'bg-emerald-50 text-emerald-800'
  }

  return cell.attempts > 0 ? 'bg-amber-50 text-amber-800' : 'bg-white text-slate-400'
}

function formatCell(cell: ContestScoreboardCell | undefined): string {
  if (!cell || cell.attempts === 0) {
    return '-'
  }

  if (cell.solved) {
    return `${cell.attempts} / ${cell.penalty ?? 0}`
  }

  return `${cell.attempts}회 시도`
}

export function ContestScoreboardTable({
  scoreboard,
}: {
  scoreboard: ContestScoreboard
}): ReactElement {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-[920px] border-separate border-spacing-0 text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="sticky left-0 z-20 border-b border-slate-200 bg-slate-50 px-4 py-3">
              순위
            </th>
            <th className="sticky left-[72px] z-20 min-w-48 border-b border-slate-200 bg-slate-50 px-4 py-3">
              사용자
            </th>
            <th className="border-b border-slate-200 px-4 py-3 text-center">해결</th>
            <th className="border-b border-slate-200 px-4 py-3 text-center">패널티</th>
            {scoreboard.problems.map((problem) => (
              <th
                className="min-w-24 border-b border-slate-200 px-4 py-3 text-center"
                key={problem.id}
                title={problem.title}
              >
                {problem.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scoreboard.rows.map((row, rowIndex) => (
            <tr className="hover:bg-slate-50" key={row.participantId}>
              <td className="sticky left-0 z-10 border-b border-slate-100 bg-white px-4 py-3 font-black">
                {rowIndex + 1}
              </td>
              <td className="sticky left-[72px] z-10 border-b border-slate-100 bg-white px-4 py-3 font-bold text-slate-900">
                {row.serviceUsername}
              </td>
              <td className="border-b border-slate-100 px-4 py-3 text-center font-black">
                {row.solvedCount}
              </td>
              <td className="border-b border-slate-100 px-4 py-3 text-center font-semibold text-slate-700">
                {row.penalty}
              </td>
              {scoreboard.problems.map((problem) => {
                const cell = row.cells.find(
                  (scoreboardCell) => scoreboardCell.contestProblemId === problem.id,
                )

                return (
                  <td
                    className="border-b border-slate-100 px-2 py-2 text-center"
                    key={problem.id}
                  >
                    <div
                      className={[
                        'mx-auto min-h-10 rounded-md px-2 py-1.5 text-xs font-black',
                        getCellClassName(cell),
                      ].join(' ')}
                    >
                      {formatCell(cell)}
                      {cell?.firstSolved ? (
                        <div className="mt-0.5 text-[10px]">최초 해결</div>
                      ) : null}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
