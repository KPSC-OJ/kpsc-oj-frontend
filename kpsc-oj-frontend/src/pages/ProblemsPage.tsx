import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, ButtonLink } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { ProblemTable } from '../components/problem/ProblemTable'
import { useProblemList } from '../hooks/useProblemList'
import { useAuth } from '../stores/useAuth'

export function ProblemsPage() {
  const [page, setPage] = useState(1)
  const { isAdmin } = useAuth()
  const { errorMessage, isLoading, problemPage } = useProblemList(page)

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-blue-600">Problems</p>
          <h1 className="text-2xl font-black text-slate-950">문제 목록</h1>
          <p className="mt-1 text-sm text-slate-500">
            백엔드에 등록된 문제를 문제 번호 순서로 조회합니다.
          </p>
        </div>
        {isAdmin ? (
          <ButtonLink to="/admin/problems/new" variant="secondary">
            <Plus size={16} />
            문제 출제
          </ButtonLink>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <Card>
          <p className="text-sm font-semibold text-slate-500">문제 목록을 불러오는 중입니다.</p>
        </Card>
      ) : problemPage && problemPage.problems.length > 0 ? (
        <>
          <ProblemTable canEdit={isAdmin} problems={problemPage.problems} />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              전체 {problemPage.totalElements}개 · {problemPage.page} /{' '}
              {Math.max(problemPage.totalPages, 1)} 페이지
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
                disabled={problemPage.totalPages === 0 || page >= problemPage.totalPages}
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
          <p className="text-sm font-semibold text-slate-700">등록된 문제가 없습니다.</p>
        </Card>
      )}
    </section>
  )
}
