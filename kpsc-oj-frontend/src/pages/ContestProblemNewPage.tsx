import { useState, type ReactElement } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Card } from '../components/common/Card'
import { ContestProblemForm } from '../components/contest/ContestProblemForm'
import { getContestErrorMessage } from '../hooks/contestErrorMessage'
import { useContestProblemMutations } from '../hooks/useContestData'
import { useContestLayoutContext } from '../layouts/contestLayoutContext'
import type { ContestProblemFormValue } from '../types/contest'

export function ContestProblemNewPage(): ReactElement {
  const { contest, contestId } = useContestLayoutContext()
  const navigate = useNavigate()
  const { createProblemWithCurrentSession } = useContestProblemMutations()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!contest.isStaff) {
    return <Navigate replace to={`/contests/${contestId}`} />
  }

  async function createProblem(formValue: ContestProblemFormValue): Promise<void> {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await createProblemWithCurrentSession(contestId, formValue)
      navigate(`/contests/${contestId}/problems`)
    } catch (error) {
      setErrorMessage(getContestErrorMessage(error, '대회 문제를 생성하지 못했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm font-black text-blue-600">Manage</p>
        <h2 className="text-xl font-black text-slate-950">대회 문제 생성</h2>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <Card>
        <ContestProblemForm
          isSubmitting={isSubmitting}
          onSubmit={createProblem}
          submitLabel="문제 생성"
        />
      </Card>
    </div>
  )
}
