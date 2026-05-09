import { requestJson } from './apiClient'
import type {
  CreateSubmissionRequestDto,
  CreateSubmissionResponseDto,
  MySubmissionListResponseDto,
  SubmissionDetailResponseDto,
} from '../types/submissionApi'

/** 인증된 사용자의 제출 목록을 최신순으로 조회한다. */
export async function listMySubmissions(
  accessToken: string,
  page: number,
  problemNumber?: number,
): Promise<MySubmissionListResponseDto> {
  const queryParams = new URLSearchParams({ page: String(page) })

  if (problemNumber !== undefined) {
    queryParams.set('problemNumber', String(problemNumber))
  }

  return requestJson<MySubmissionListResponseDto>({
    accessToken,
    method: 'GET',
    path: `/api/v1/submissions/me?${queryParams.toString()}`,
  })
}

/** 인증된 사용자의 소스 코드 제출을 생성한다. */
export async function createSubmission(
  accessToken: string,
  requestDto: CreateSubmissionRequestDto,
): Promise<CreateSubmissionResponseDto> {
  return requestJson<CreateSubmissionResponseDto>({
    accessToken,
    body: requestDto,
    method: 'POST',
    path: '/api/v1/submissions',
  })
}

/** 제출 UUID 기준으로 채점 상태와 상세 결과를 조회한다. */
export async function getSubmissionDetail(
  accessToken: string,
  submissionId: string,
): Promise<SubmissionDetailResponseDto> {
  return requestJson<SubmissionDetailResponseDto>({
    accessToken,
    method: 'GET',
    path: `/api/v1/submissions/${submissionId}`,
  })
}
