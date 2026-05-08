import { requestJson } from './apiClient'
import type {
  CreateProblemRequestDto,
  CreateProblemResponseDto,
  ProblemDetailResponseDto,
  ProblemListResponseDto,
} from '../types/problemApi'

/** 인증된 사용자가 볼 수 있는 문제 목록을 조회한다. */
export async function listProblems(
  accessToken: string,
  page: number,
): Promise<ProblemListResponseDto> {
  return requestJson<ProblemListResponseDto>({
    accessToken,
    method: 'GET',
    path: `/api/v1/problems?page=${page}`,
  })
}

/** 문제 번호 기준으로 공개 문제 상세와 예제 테스트 케이스를 조회한다. */
export async function getProblemDetail(
  accessToken: string,
  problemNumber: number,
): Promise<ProblemDetailResponseDto> {
  return requestJson<ProblemDetailResponseDto>({
    accessToken,
    method: 'GET',
    path: `/api/v1/problems/${problemNumber}`,
  })
}

/** 관리자 권한이 필요한 문제 생성 API를 호출한다. */
export async function createProblem(
  accessToken: string,
  requestDto: CreateProblemRequestDto,
): Promise<CreateProblemResponseDto> {
  return requestJson<CreateProblemResponseDto>({
    accessToken,
    body: requestDto,
    method: 'POST',
    path: '/api/v1/problems',
  })
}
