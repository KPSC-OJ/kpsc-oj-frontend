import { useCallback } from 'react'
import { createSubmission } from '../services/submissionService'
import { useAuth } from '../stores/useAuth'
import type { AuthApiError } from '../types/auth'
import type {
  CreateSubmissionRequestDto,
  CreateSubmissionResponseDto,
} from '../types/submissionApi'

function createMissingSessionError(): AuthApiError {
  return {
    code: 'AUTHENTICATION_FAILED',
    message: '로그인이 필요합니다.',
    status: 401,
  }
}

/** 현재 인증 세션으로 소스 코드 제출 생성 요청을 수행한다. */
export function useCreateSubmission(): {
  createSubmissionWithCurrentSession: (
    requestDto: CreateSubmissionRequestDto,
  ) => Promise<CreateSubmissionResponseDto>
} {
  const { isAuthenticated, requestWithFreshSession } = useAuth()

  const createSubmissionWithCurrentSession = useCallback(
    async (
      requestDto: CreateSubmissionRequestDto,
    ): Promise<CreateSubmissionResponseDto> => {
      if (!isAuthenticated) {
        throw createMissingSessionError()
      }

      return requestWithFreshSession((accessToken) =>
        createSubmission(accessToken, requestDto),
      )
    },
    [isAuthenticated, requestWithFreshSession],
  )

  return { createSubmissionWithCurrentSession }
}
