import { useEffect, useState } from 'react'
import { listMySubmissions } from '../services/submissionService'
import { useAuth } from '../stores/useAuth'
import type { AuthApiError } from '../types/auth'
import type { SubmissionPage } from '../types/submission'
import type { MySubmissionListResponseDto } from '../types/submissionApi'

function mapSubmissionListResponse(responseDto: MySubmissionListResponseDto): SubmissionPage {
  return {
    page: responseDto.page,
    pageSize: responseDto.pageSize,
    submissions: responseDto.submissions.map((submissionDto) => ({
      id: submissionDto.id,
      language: submissionDto.language,
      problemNumber: submissionDto.problemNumber,
      scorePercentage: submissionDto.scorePercentage ?? null,
      status: submissionDto.status,
      submittedAt: submissionDto.submittedAt,
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

  return '제출 목록을 불러오지 못했습니다.'
}

/** 내 제출 목록 API 응답을 제출 목록 화면 모델로 변환한다. */
export function useMySubmissions(
  page: number,
  problemNumber?: number,
  refreshKey = 0,
): {
  errorMessage: string | null
  isLoading: boolean
  submissionPage: SubmissionPage | null
} {
  const { isAuthenticated, requestWithFreshSession } = useAuth()
  const [submissionPage, setSubmissionPage] = useState<SubmissionPage | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadSubmissions(): Promise<void> {
      if (!isAuthenticated) {
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const responseDto = await requestWithFreshSession((accessToken) =>
          listMySubmissions(accessToken, page, problemNumber),
        )

        if (isActive) {
          setSubmissionPage(mapSubmissionListResponse(responseDto))
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(getErrorMessage(error))
          setSubmissionPage(null)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadSubmissions()

    return () => {
      isActive = false
    }
  }, [isAuthenticated, page, problemNumber, refreshKey, requestWithFreshSession])

  return { errorMessage, isLoading, submissionPage }
}
