import { useEffect, useState } from 'react'
import { getSubmissionDetail } from '../services/submissionService'
import { useAuth } from '../stores/useAuth'
import type { AuthApiError } from '../types/auth'
import type { SubmissionDetail } from '../types/submission'
import type { SubmissionDetailResponseDto } from '../types/submissionApi'

const pollingIntervalMillis = 2500
const pendingSubmissionStatuses = new Set(['QUEUED', 'RUNNING', 'JUDGING', 'PENDING'])

function mapSubmissionDetailResponse(
  responseDto: SubmissionDetailResponseDto,
): SubmissionDetail {
  return {
    compileErrorMessage: responseDto.compileErrorMessage ?? null,
    id: responseDto.id,
    language: responseDto.language,
    problemNumber: responseDto.problemNumber,
    runtimeErrorMessage: responseDto.runtimeErrorMessage ?? null,
    scorePercentage: responseDto.scorePercentage ?? null,
    sourceCode: responseDto.sourceCode,
    status: responseDto.status,
    subtaskResults: (responseDto.subtaskResults ?? []).map((subtaskResultDto) => ({
      maxScore: subtaskResultDto.maxScore,
      order: subtaskResultDto.order,
      score: subtaskResultDto.score,
      status: subtaskResultDto.status,
      title: subtaskResultDto.title,
    })),
    submittedAt: responseDto.submittedAt,
    totalScore: responseDto.totalScore ?? null,
  }
}

function getErrorMessage(error: unknown): string {
  const apiError = error as Partial<AuthApiError>

  if (apiError.status === 401 || apiError.code === 'AUTHENTICATION_FAILED') {
    return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  }

  if (apiError.status === 403 || apiError.code === 'FORBIDDEN_OPERATION') {
    return '제출 상세를 조회할 권한이 없습니다.'
  }

  if (apiError.status === 404 || apiError.code === 'SUBMISSION_NOT_FOUND') {
    return '제출 결과를 찾을 수 없습니다.'
  }

  if (typeof apiError.message === 'string') {
    return apiError.message
  }

  return '제출 결과를 불러오지 못했습니다.'
}

function shouldPollSubmission(status: string): boolean {
  return pendingSubmissionStatuses.has(status)
}

/** 제출 상세를 조회하고 채점 대기/진행 상태에서는 주기적으로 다시 조회한다. */
export function useSubmissionDetail(submissionId: string | null): {
  errorMessage: string | null
  isLoading: boolean
  isPolling: boolean
  submissionDetail: SubmissionDetail | null
} {
  const { isAuthenticated, requestWithFreshSession } = useAuth()
  const [submissionDetail, setSubmissionDetail] = useState<SubmissionDetail | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const currentSubmissionId = submissionId

    if (!isAuthenticated || !currentSubmissionId) {
      return
    }

    const currentDetailSubmissionId = currentSubmissionId
    let isActive = true
    let pollingTimeoutId: ReturnType<typeof setTimeout> | null = null

    async function loadSubmissionDetail(isInitialLoad: boolean): Promise<void> {
      if (isInitialLoad) {
        setIsLoading(true)
      }

      setErrorMessage(null)

      try {
        const responseDto = await requestWithFreshSession((accessToken) =>
          getSubmissionDetail(accessToken, currentDetailSubmissionId),
        )
        const nextSubmissionDetail = mapSubmissionDetailResponse(responseDto)

        if (!isActive) {
          return
        }

        setSubmissionDetail(nextSubmissionDetail)

        if (shouldPollSubmission(nextSubmissionDetail.status)) {
          pollingTimeoutId = setTimeout(() => {
            void loadSubmissionDetail(false)
          }, pollingIntervalMillis)
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(getErrorMessage(error))
        }
      } finally {
        if (isActive && isInitialLoad) {
          setIsLoading(false)
        }
      }
    }

    void loadSubmissionDetail(true)

    return () => {
      isActive = false

      if (pollingTimeoutId) {
        clearTimeout(pollingTimeoutId)
      }
    }
  }, [isAuthenticated, requestWithFreshSession, submissionId])

  const visibleSubmissionDetail =
    submissionDetail?.id === submissionId ? submissionDetail : null

  return {
    errorMessage: submissionId ? errorMessage : null,
    isLoading: Boolean(submissionId) && isLoading,
    isPolling: visibleSubmissionDetail
      ? shouldPollSubmission(visibleSubmissionDetail.status)
      : false,
    submissionDetail: visibleSubmissionDetail,
  }
}
