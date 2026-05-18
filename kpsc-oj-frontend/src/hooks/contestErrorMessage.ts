import type { AuthApiError } from '../types/auth'

const contestErrorMessages: Record<string, string> = {
  AUTHENTICATION_FAILED: '로그인이 필요하거나 세션이 만료되었습니다.',
  CONTEST_FORBIDDEN: '이 대회에 접근할 권한이 없습니다.',
  CONTEST_NOT_FOUND: '대회를 찾을 수 없습니다.',
  CONTEST_NOT_JOINED: '대회 참가 후 제출할 수 있습니다.',
  CONTEST_NOT_RUNNING: '대회가 진행 중일 때만 제출할 수 있습니다.',
  CONTEST_PARTICIPANT_NOT_FOUND: '참가 신청 정보를 찾을 수 없습니다.',
  CONTEST_PROBLEM_NOT_FOUND: '대회 문제를 찾을 수 없습니다.',
  CONTEST_STAFF_REQUIRED: '대회 운영진 권한이 필요합니다.',
  JUDGE_UNAVAILABLE:
    'judge 서버 문제로 예시 정답 코드 검증을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.',
  PROBLEM_VERIFICATION_FAILED:
    '예시 정답 코드가 비공개 채점 테스트 케이스를 통과하지 못했습니다. 코드와 기대 출력을 확인해주세요.',
  UNSUPPORTED_LANGUAGE: '지원하지 않는 언어입니다.',
  VALIDATION_ERROR: '입력값을 확인해주세요.',
}

export function getContestErrorMessage(error: unknown, fallbackMessage: string): string {
  const apiError = error as Partial<AuthApiError>

  if (apiError.code && contestErrorMessages[apiError.code]) {
    return contestErrorMessages[apiError.code]
  }

  if (typeof apiError.message === 'string') {
    return apiError.message
  }

  return fallbackMessage
}
