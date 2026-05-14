import type { ReactElement } from 'react'
import { ProblemDefinitionForm } from '../components/problem/ProblemDefinitionForm'
import { useCreateProblem } from '../hooks/useCreateProblem'

export function AdminProblemNewPage(): ReactElement {
  const { createProblemWithCurrentSession } = useCreateProblem()

  return (
    <ProblemDefinitionForm
      description="문제 본문, 제한 조건, 예시 정답 코드, 선택 checker, 예제와 일반/서브테스크 채점 테스트 케이스를 등록합니다."
      eyebrow="Admin"
      forbiddenErrorMessage="문제 생성 권한이 없습니다."
      onSubmit={createProblemWithCurrentSession}
      requiresReferenceSolution
      resetOnSuccess
      submitErrorFallback="문제를 생성하지 못했습니다."
      submitLabel="문제 생성"
      submittingLabel="검증 후 생성 중"
      successTitle="문제가 생성되었습니다."
      title="문제 생성"
    />
  )
}
