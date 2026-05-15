import { useState, type ReactElement } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { ContestProblemForm } from '../components/contest/ContestProblemForm'
import { getContestErrorMessage } from '../hooks/contestErrorMessage'
import { useContestProblem, useContestProblemMutations } from '../hooks/useContestData'
import { useContestLayoutContext } from '../layouts/contestLayoutContext'
import type { ContestProblemDetail, ContestProblemFormValue } from '../types/contest'

function createInitialFormValue(problem: ContestProblemDetail): ContestProblemFormValue {
  return {
    constraints: problem.constraints,
    displayOrder: problem.displayOrder,
    inputDescription: problem.inputDescription,
    label: problem.label,
    memoryLimitKb: problem.memoryLimitKb,
    outputDescription: problem.outputDescription,
    score: problem.score,
    statement: problem.statement,
    testCases: [
      ...problem.exampleTestCases.map((testCase) => ({
        caseOrder: testCase.caseOrder,
        inputText: testCase.input,
        kind: 'EXAMPLE' as const,
        outputText: testCase.output,
      })),
      {
        caseOrder: Math.max(0, ...problem.exampleTestCases.map((testCase) => testCase.caseOrder)) + 1,
        inputText: '',
        kind: 'HIDDEN' as const,
        outputText: '',
      },
    ],
    timeLimitMillis: problem.timeLimitMillis,
    title: problem.title,
  }
}

export function ContestProblemEditPage(): ReactElement {
  const { contestProblemId } = useParams()
  const { contest, contestId } = useContestLayoutContext()
  const navigate = useNavigate()
  const {
    deleteProblemWithCurrentSession,
    updateProblemWithCurrentSession,
  } = useContestProblemMutations()
  const { errorMessage: loadErrorMessage, isLoading, problem } = useContestProblem(
    contestId,
    contestProblemId,
  )
  const [mutationErrorMessage, setMutationErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!contest.isStaff) {
    return <Navigate replace to={`/contests/${contestId}`} />
  }

  async function updateProblem(formValue: ContestProblemFormValue): Promise<void> {
    if (!contestProblemId) {
      return
    }

    setIsSubmitting(true)
    setMutationErrorMessage(null)

    try {
      await updateProblemWithCurrentSession(contestId, contestProblemId, formValue)
      navigate(`/contests/${contestId}/problems/${contestProblemId}`)
    } catch (error) {
      setMutationErrorMessage(getContestErrorMessage(error, '대회 문제를 수정하지 못했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteProblem(): Promise<void> {
    if (!contestProblemId) {
      return
    }

    const confirmed = window.confirm(
      '대회 문제를 삭제합니다. 기존 제출이 연결된 문제는 삭제에 실패할 수 있습니다.',
    )

    if (!confirmed) {
      return
    }

    setIsDeleting(true)
    setMutationErrorMessage(null)

    try {
      await deleteProblemWithCurrentSession(contestId, contestProblemId)
      navigate(`/contests/${contestId}/problems`)
    } catch (error) {
      setMutationErrorMessage(getContestErrorMessage(error, '대회 문제를 삭제하지 못했습니다.'))
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm font-semibold text-slate-500">대회 문제를 불러오는 중입니다.</p>
      </Card>
    )
  }

  if (!problem) {
    return (
      <Card>
        <h2 className="text-xl font-black text-slate-950">
          {loadErrorMessage ?? '대회 문제를 찾을 수 없습니다.'}
        </h2>
      </Card>
    )
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black text-blue-600">Manage</p>
          <h2 className="text-xl font-black text-slate-950">대회 문제 수정</h2>
        </div>
        <Button
          disabled={isDeleting}
          onClick={() => void deleteProblem()}
          type="button"
          variant="danger"
        >
          <Trash2 size={16} />
          삭제
        </Button>
      </div>

      {mutationErrorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {mutationErrorMessage}
        </div>
      ) : null}

      <Card>
        <ContestProblemForm
          initialValue={createInitialFormValue(problem)}
          isSubmitting={isSubmitting}
          key={problem.id}
          notice="현재 상세 API는 HIDDEN testcase를 반환하지 않으므로 저장 시 testcase set을 입력값으로 교체합니다."
          onSubmit={updateProblem}
          submitLabel="수정 저장"
        />
      </Card>
    </div>
  )
}
