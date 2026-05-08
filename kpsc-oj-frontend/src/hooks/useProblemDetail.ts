import { useEffect, useState } from 'react'
import { getProblemDetail } from '../services/problemService'
import { useAuth } from '../stores/useAuth'
import type { AuthApiError } from '../types/auth'
import type { ProblemDetail } from '../types/problem'
import type { ProblemDetailResponseDto } from '../types/problemApi'

function mapProblemDetailResponse(responseDto: ProblemDetailResponseDto): ProblemDetail {
  return {
    exampleTestCases: responseDto.exampleTestCases.map((testCaseDto) => ({
      input: testCaseDto.input,
      order: testCaseDto.order,
      output: testCaseDto.output,
    })),
    memoryLimitMegabytes: responseDto.memoryLimitMegabytes,
    problemNumber: responseDto.problemNumber,
    statementMarkdown: responseDto.statementMarkdown,
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

  if (apiError.status === 401 || apiError.code === 'AUTHENTICATION_FAILED') {
    return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  }

  if (typeof apiError.message === 'string') {
    return apiError.message
  }

  return '문제 정보를 불러오지 못했습니다.'
}

/** 문제 번호 기반 상세 API 응답을 제출 화면 모델로 변환한다. */
export function useProblemDetail(problemNumber: number | null): {
  errorMessage: string | null
  isLoading: boolean
  problem: ProblemDetail | null
} {
  const { session } = useAuth()
  const [problem, setProblem] = useState<ProblemDetail | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadProblem(): Promise<void> {
      if (!session || problemNumber === null) {
        setIsLoading(false)
        setProblem(null)
        setErrorMessage('문제 번호가 올바르지 않습니다.')

        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const responseDto = await getProblemDetail(session.accessToken, problemNumber)

        if (isActive) {
          setProblem(mapProblemDetailResponse(responseDto))
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(getErrorMessage(error))
          setProblem(null)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadProblem()

    return () => {
      isActive = false
    }
  }, [problemNumber, session])

  return { errorMessage, isLoading, problem }
}
