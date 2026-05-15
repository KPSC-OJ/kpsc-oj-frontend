import { requestJson } from './apiClient'
import type {
  ContestDetailResponseDto,
  ContestJoinResponseDto,
  ContestListItemResponseDto,
  ContestProblemDetailResponseDto,
  ContestProblemListItemResponseDto,
  ContestProblemMutationRequestDto,
  ContestProblemMutationResponseDto,
  ContestScoreboardResponseDto,
  ContestSubmissionListItemResponseDto,
  ContestSubmissionRequestDto,
  ContestSubmissionResponseDto,
} from '../types/contestApi'

/** 대회 목록을 조회한다. 로그인 세션이 있으면 비공개 대회 노출 판단에 사용된다. */
export async function getContests(
  accessToken?: string,
): Promise<ContestListItemResponseDto[]> {
  return requestJson<ContestListItemResponseDto[]>({
    accessToken,
    method: 'GET',
    path: '/api/v1/contests',
  })
}

/** 대회 홈에 필요한 상세와 현재 사용자 권한 상태를 조회한다. */
export async function getContest(
  contestId: string,
  accessToken?: string,
): Promise<ContestDetailResponseDto> {
  return requestJson<ContestDetailResponseDto>({
    accessToken,
    method: 'GET',
    path: `/api/v1/contests/${contestId}`,
  })
}

/** 현재 인증 사용자를 OPEN 대회 참가자로 등록한다. */
export async function joinContest(
  accessToken: string,
  contestId: string,
): Promise<ContestJoinResponseDto> {
  return requestJson<ContestJoinResponseDto>({
    accessToken,
    method: 'POST',
    path: `/api/v1/contests/${contestId}/join`,
  })
}

/** 대회 전용 문제 목록과 현재 사용자의 풀이 상태를 조회한다. */
export async function getContestProblems(
  contestId: string,
  accessToken?: string,
): Promise<ContestProblemListItemResponseDto[]> {
  return requestJson<ContestProblemListItemResponseDto[]>({
    accessToken,
    method: 'GET',
    path: `/api/v1/contests/${contestId}/problems`,
  })
}

/** 대회 전용 문제 상세를 조회한다. HIDDEN testcase는 백엔드 계약상 포함되지 않는다. */
export async function getContestProblem(
  contestId: string,
  contestProblemId: string,
  accessToken?: string,
): Promise<ContestProblemDetailResponseDto> {
  return requestJson<ContestProblemDetailResponseDto>({
    accessToken,
    method: 'GET',
    path: `/api/v1/contests/${contestId}/problems/${contestProblemId}`,
  })
}

/** 운영진이 대회 전용 문제를 생성한다. */
export async function createContestProblem(
  accessToken: string,
  contestId: string,
  payload: ContestProblemMutationRequestDto,
): Promise<ContestProblemMutationResponseDto> {
  return requestJson<ContestProblemMutationResponseDto>({
    accessToken,
    body: payload,
    method: 'POST',
    path: `/api/v1/contests/${contestId}/problems`,
  })
}

/** 운영진이 대회 전용 문제 정의와 testcase set을 교체한다. */
export async function updateContestProblem(
  accessToken: string,
  contestId: string,
  contestProblemId: string,
  payload: ContestProblemMutationRequestDto,
): Promise<ContestProblemMutationResponseDto> {
  return requestJson<ContestProblemMutationResponseDto>({
    accessToken,
    body: payload,
    method: 'PATCH',
    path: `/api/v1/contests/${contestId}/problems/${contestProblemId}`,
  })
}

/** 운영진이 대회 전용 문제를 삭제한다. */
export async function deleteContestProblem(
  accessToken: string,
  contestId: string,
  contestProblemId: string,
): Promise<void> {
  await requestJson<void>({
    accessToken,
    method: 'DELETE',
    path: `/api/v1/contests/${contestId}/problems/${contestProblemId}`,
  })
}

/** 인증 사용자가 대회 전용 문제에 소스 코드를 제출한다. */
export async function submitContestProblem(
  accessToken: string,
  contestId: string,
  contestProblemId: string,
  payload: ContestSubmissionRequestDto,
): Promise<ContestSubmissionResponseDto> {
  return requestJson<ContestSubmissionResponseDto>({
    accessToken,
    body: payload,
    method: 'POST',
    path: `/api/v1/contests/${contestId}/problems/${contestProblemId}/submissions`,
  })
}

/** 현재 사용자의 대회 제출 목록을 최신순으로 조회한다. */
export async function getMyContestSubmissions(
  accessToken: string,
  contestId: string,
): Promise<ContestSubmissionListItemResponseDto[]> {
  return requestJson<ContestSubmissionListItemResponseDto[]>({
    accessToken,
    method: 'GET',
    path: `/api/v1/contests/${contestId}/submissions/me`,
  })
}

/** 운영진이 대회 전체 제출 목록을 최신순으로 조회한다. */
export async function getContestSubmissions(
  accessToken: string,
  contestId: string,
): Promise<ContestSubmissionListItemResponseDto[]> {
  return requestJson<ContestSubmissionListItemResponseDto[]>({
    accessToken,
    method: 'GET',
    path: `/api/v1/contests/${contestId}/submissions`,
  })
}

/** 대회 스코어보드 rows와 문제 header를 조회한다. */
export async function getContestScoreboard(
  contestId: string,
  accessToken?: string,
): Promise<ContestScoreboardResponseDto> {
  return requestJson<ContestScoreboardResponseDto>({
    accessToken,
    method: 'GET',
    path: `/api/v1/contests/${contestId}/scoreboard`,
  })
}
