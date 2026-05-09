import { useCallback } from 'react'
import { updateProblem } from '../services/problemService'
import { useAuth } from '../stores/useAuth'
import type { AuthApiError } from '../types/auth'
import type {
  UpdateProblemRequestDto,
  UpdateProblemResponseDto,
} from '../types/problemApi'

function createMissingSessionError(): AuthApiError {
  return {
    code: 'AUTHENTICATION_FAILED',
    message: '로그인이 필요합니다.',
    status: 401,
  }
}

/** 현재 인증 세션으로 문제 정의 수정 요청을 수행한다. */
export function useUpdateProblem(): {
  updateProblemWithCurrentSession: (
    problemNumber: number,
    requestDto: UpdateProblemRequestDto,
  ) => Promise<UpdateProblemResponseDto>
} {
  const { isAuthenticated, requestWithFreshSession } = useAuth()

  const updateProblemWithCurrentSession = useCallback(
    async (
      problemNumber: number,
      requestDto: UpdateProblemRequestDto,
    ): Promise<UpdateProblemResponseDto> => {
      if (!isAuthenticated) {
        throw createMissingSessionError()
      }

      return requestWithFreshSession((accessToken) =>
        updateProblem(accessToken, problemNumber, requestDto),
      )
    },
    [isAuthenticated, requestWithFreshSession],
  )

  return { updateProblemWithCurrentSession }
}
