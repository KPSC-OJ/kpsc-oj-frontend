import { useEffect, useState } from 'react'
import { getProblemDefinition } from '../services/problemService'
import { useAuth } from '../stores/useAuth'
import type { AuthApiError } from '../types/auth'
import type { ProblemDefinition } from '../types/problem'
import type { ProblemDefinitionResponseDto } from '../types/problemApi'

function mapProblemDefinitionResponse(
  responseDto: ProblemDefinitionResponseDto,
): ProblemDefinition {
  return {
    actualTestCaseInputs: responseDto.actualTestCaseInputs,
    actualTestCaseOutputs: responseDto.actualTestCaseOutputs,
    checkerCode: responseDto.checkerCode ?? null,
    exampleInputs: responseDto.exampleInputs,
    exampleOutputs: responseDto.exampleOutputs,
    id: responseDto.id,
    memoryLimitMegabytes: responseDto.memoryLimitMegabytes,
    problemNumber: responseDto.problemNumber,
    statementMarkdown: responseDto.statementMarkdown,
    subtasks: (responseDto.subtasks ?? []).map((subtaskDto) => ({
      order: subtaskDto.order,
      score: subtaskDto.score,
      testCases: subtaskDto.testCases.map((testCaseDto) => ({
        input: testCaseDto.input,
        order: testCaseDto.order,
        output: testCaseDto.output,
      })),
      title: subtaskDto.title,
    })),
    tag: responseDto.tag,
    timeLimitSeconds: responseDto.timeLimitSeconds,
    title: responseDto.title,
  }
}

function getErrorMessage(error: unknown): string {
  const apiError = error as Partial<AuthApiError>

  if (apiError.status === 404 || apiError.code === 'PROBLEM_NOT_FOUND') {
    return '문제를 찾을 수 없습니다.'
  }

  if (apiError.status === 403 || apiError.code === 'FORBIDDEN_OPERATION') {
    return '문제 수정 권한이 없습니다.'
  }

  if (apiError.status === 401 || apiError.code === 'AUTHENTICATION_FAILED') {
    return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  }

  if (typeof apiError.message === 'string') {
    return apiError.message
  }

  return '문제 정의를 불러오지 못했습니다.'
}

/** 문제 수정 폼에 필요한 전체 문제 정의 API 응답을 화면 모델로 변환한다. */
export function useProblemDefinition(problemNumber: number | null): {
  errorMessage: string | null
  isLoading: boolean
  problemDefinition: ProblemDefinition | null
} {
  const { isAuthenticated, requestWithFreshSession } = useAuth()
  const [problemDefinition, setProblemDefinition] = useState<ProblemDefinition | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadProblemDefinition(): Promise<void> {
      if (!isAuthenticated || problemNumber === null) {
        setIsLoading(false)
        setProblemDefinition(null)
        setErrorMessage('문제 번호가 올바르지 않습니다.')

        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const responseDto = await requestWithFreshSession((accessToken) =>
          getProblemDefinition(accessToken, problemNumber),
        )

        if (isActive) {
          setProblemDefinition(mapProblemDefinitionResponse(responseDto))
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(getErrorMessage(error))
          setProblemDefinition(null)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadProblemDefinition()

    return () => {
      isActive = false
    }
  }, [isAuthenticated, problemNumber, requestWithFreshSession])

  return {
    errorMessage,
    isLoading:
      isLoading ||
      (problemNumber !== null && problemDefinition?.problemNumber !== problemNumber),
    problemDefinition,
  }
}
