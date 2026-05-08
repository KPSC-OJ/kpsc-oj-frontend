import { useCallback } from 'react'
import { createProblem } from '../services/problemService'
import { useAuth } from '../stores/useAuth'
import type { AuthApiError } from '../types/auth'
import type {
  CreateProblemRequestDto,
  CreateProblemResponseDto,
} from '../types/problemApi'

function createMissingSessionError(): AuthApiError {
  return {
    code: 'AUTHENTICATION_FAILED',
    message: '로그인이 필요합니다.',
    status: 401,
  }
}

/** 현재 인증 세션으로 관리자 문제 생성 요청을 수행한다. */
export function useCreateProblem(): {
  createProblemWithCurrentSession: (
    requestDto: CreateProblemRequestDto,
  ) => Promise<CreateProblemResponseDto>
} {
  const { session } = useAuth()

  const createProblemWithCurrentSession = useCallback(
    async (requestDto: CreateProblemRequestDto): Promise<CreateProblemResponseDto> => {
      if (!session) {
        throw createMissingSessionError()
      }

      return createProblem(session.accessToken, requestDto)
    },
    [session],
  )

  return { createProblemWithCurrentSession }
}
