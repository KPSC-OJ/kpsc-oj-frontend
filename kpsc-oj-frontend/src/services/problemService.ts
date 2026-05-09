import { requestJson } from './apiClient'
import type {
  CreateProblemRequestDto,
  CreateProblemResponseDto,
  ProblemDefinitionResponseDto,
  ProblemDetailResponseDto,
  ProblemListResponseDto,
  UpdateProblemRequestDto,
  UpdateProblemResponseDto,
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

/** 문제 생성자가 수정 화면에 사용할 전체 문제 정의를 조회한다. */
export async function getProblemDefinition(
  accessToken: string,
  problemNumber: number,
): Promise<ProblemDefinitionResponseDto> {
  return requestJson<ProblemDefinitionResponseDto>({
    accessToken,
    method: 'GET',
    path: `/api/v1/problems/${problemNumber}/definition`,
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

/** 문제 생성자가 전체 문제 정의를 수정한다. */
export async function updateProblem(
  accessToken: string,
  problemNumber: number,
  requestDto: UpdateProblemRequestDto,
): Promise<UpdateProblemResponseDto> {
  return requestJson<UpdateProblemResponseDto>({
    accessToken,
    body: requestDto,
    method: 'PATCH',
    path: `/api/v1/problems/${problemNumber}`,
  })
}
