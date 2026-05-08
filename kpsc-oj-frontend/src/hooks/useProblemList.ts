import { useEffect, useState } from 'react'
import { listProblems } from '../services/problemService'
import { useAuth } from '../stores/useAuth'
import type { AuthApiError } from '../types/auth'
import type { ProblemPage } from '../types/problem'
import type { ProblemListResponseDto } from '../types/problemApi'

function mapProblemListResponse(responseDto: ProblemListResponseDto): ProblemPage {
  return {
    page: responseDto.page,
    pageSize: responseDto.pageSize,
    problems: responseDto.problems.map((problemDto) => ({
      memoryLimitMegabytes: problemDto.memoryLimitMegabytes,
      problemNumber: problemDto.problemNumber,
      tag: problemDto.tag,
      timeLimitSeconds: problemDto.timeLimitSeconds,
      title: problemDto.title,
    })),
    totalElements: responseDto.totalElements,
    totalPages: responseDto.totalPages,
  }
}

function getErrorMessage(error: unknown): string {
  const apiError = error as Partial<AuthApiError>

  if (apiError.status === 401 || apiError.code === 'AUTHENTICATION_FAILED') {
    return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  }

  if (typeof apiError.message === 'string') {
    return apiError.message
  }

  return '문제 목록을 불러오지 못했습니다.'
}

/** 문제 목록 API 응답을 문제 목록 화면 모델로 변환한다. */
export function useProblemList(page: number): {
  errorMessage: string | null
  isLoading: boolean
  problemPage: ProblemPage | null
} {
  const { session } = useAuth()
  const [problemPage, setProblemPage] = useState<ProblemPage | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadProblems(): Promise<void> {
      if (!session) {
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const responseDto = await listProblems(session.accessToken, page)

        if (isActive) {
          setProblemPage(mapProblemListResponse(responseDto))
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(getErrorMessage(error))
          setProblemPage(null)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadProblems()

    return () => {
      isActive = false
    }
  }, [page, session])

  return { errorMessage, isLoading, problemPage }
}
