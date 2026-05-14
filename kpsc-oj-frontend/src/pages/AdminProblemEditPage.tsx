import { useCallback, type ReactElement } from 'react'
import { useParams } from 'react-router-dom'
import { ButtonLink } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { ProblemDefinitionForm } from '../components/problem/ProblemDefinitionForm'
import { useProblemDefinition } from '../hooks/useProblemDefinition'
import { useUpdateProblem } from '../hooks/useUpdateProblem'
import type { AuthApiError } from '../types/auth'
import type { ProblemMutationRequestDto } from '../types/problemApi'

function parseRouteProblemNumber(value: string | undefined): number | null {
  if (!value) {
    return null
  }

  const parsedValue = Number(value)

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null
}

function createInvalidProblemNumberError(): AuthApiError {
  return {
    code: 'INVALID_REQUEST',
    message: '문제 번호가 올바르지 않습니다.',
    status: 400,
  }
}

export function AdminProblemEditPage(): ReactElement {
  const { problemNumber: rawProblemNumber } = useParams()
  const problemNumber = parseRouteProblemNumber(rawProblemNumber)
  const { errorMessage, isLoading, problemDefinition } =
    useProblemDefinition(problemNumber)
  const { updateProblemWithCurrentSession } = useUpdateProblem()

  const updateCurrentProblem = useCallback(
    (requestDto: ProblemMutationRequestDto) => {
      if (problemNumber === null) {
        throw createInvalidProblemNumberError()
      }

      return updateProblemWithCurrentSession(problemNumber, requestDto)
    },
    [problemNumber, updateProblemWithCurrentSession],
  )

  if (isLoading) {
    return (
      <Card>
        <p className="text-sm font-semibold text-slate-500">
          문제 수정 정보를 불러오는 중입니다.
        </p>
      </Card>
    )
  }

  if (errorMessage || !problemDefinition) {
    return (
      <section className="space-y-4">
        <Card className="space-y-4">
          <div>
            <p className="text-sm font-bold text-blue-600">Admin</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">문제 수정</h1>
          </div>
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {errorMessage ?? '문제 수정 정보를 불러오지 못했습니다.'}
          </div>
          <ButtonLink to="/problems" variant="secondary">
            문제 목록으로
          </ButtonLink>
        </Card>
      </section>
    )
  }

  return (
    <ProblemDefinitionForm
      description="기존 문제 정의와 선택 checker, 예제와 일반/서브테스크 채점 테스트 케이스를 수정합니다."
      eyebrow="Admin"
      forbiddenErrorMessage="문제 수정 권한이 없습니다."
      initialValue={problemDefinition}
      key={problemDefinition.id}
      onSubmit={updateCurrentProblem}
      submitErrorFallback="문제를 수정하지 못했습니다."
      submitLabel="수정 저장"
      submittingLabel="저장 중"
      successTitle="문제가 수정되었습니다."
      title={`문제 ${problemDefinition.problemNumber} 수정`}
    />
  )
}
