import { useCallback, useEffect, useState } from 'react'
import {
  createContestProblem,
  deleteContestProblem,
  getContest,
  getContestProblem,
  getContestProblems,
  getContestScoreboard,
  getContestSubmissions,
  getContests,
  getMyContestSubmissions,
  joinContest,
  submitContestProblem,
  updateContestProblem,
} from '../services/contestService'
import { useAuth } from '../stores/useAuth'
import type { AuthApiError } from '../types/auth'
import type {
  ContestCreatedSubmission,
  ContestDetail,
  ContestListItem,
  ContestProblemDetail,
  ContestProblemFormValue,
  ContestProblemListItem,
  ContestScoreboard,
  ContestSubmission,
} from '../types/contest'
import type {
  ContestDetailResponseDto,
  ContestListItemResponseDto,
  ContestProblemDetailResponseDto,
  ContestProblemListItemResponseDto,
  ContestProblemMutationRequestDto,
  ContestScoreboardResponseDto,
  ContestSubmissionListItemResponseDto,
  ContestSubmissionRequestDto,
  ContestSubmissionResponseDto,
} from '../types/contestApi'
import { getContestErrorMessage } from './contestErrorMessage'

type RequestWithFreshSession = <TResult>(
  request: (accessToken: string) => Promise<TResult>,
) => Promise<TResult>

type ContestSubmissionScope = 'all' | 'mine'

const contestSubmissionPollingIntervalMillis = 2500
const pendingContestSubmissionStatuses = new Set(['QUEUED', 'RUNNING', 'JUDGING', 'PENDING'])

function padDateTimePart(value: number): string {
  return value.toString().padStart(2, '0')
}

function formatContestDateTime(dateTime: string): string {
  const parsedDateTime = new Date(dateTime)

  if (Number.isNaN(parsedDateTime.getTime())) {
    return dateTime
  }

  const year = parsedDateTime.getFullYear()
  const month = padDateTimePart(parsedDateTime.getMonth() + 1)
  const date = padDateTimePart(parsedDateTime.getDate())
  const hours = padDateTimePart(parsedDateTime.getHours())
  const minutes = padDateTimePart(parsedDateTime.getMinutes())

  return `${year}-${month}-${date}-${hours}-${minutes}`
}

function createMissingSessionError(): AuthApiError {
  return {
    code: 'AUTHENTICATION_FAILED',
    message: '로그인이 필요합니다.',
    status: 401,
  }
}

async function requestMaybeWithFreshSession<TResult>(
  isAuthenticated: boolean,
  requestWithFreshSession: RequestWithFreshSession,
  request: (accessToken?: string) => Promise<TResult>,
): Promise<TResult> {
  if (isAuthenticated) {
    return requestWithFreshSession((accessToken) => request(accessToken))
  }

  return request()
}

function mapContestListItem(responseDto: ContestListItemResponseDto): ContestListItem {
  return {
    description: responseDto.description,
    endTime: formatContestDateTime(responseDto.endTime),
    id: responseDto.id,
    startTime: formatContestDateTime(responseDto.startTime),
    status: responseDto.status,
    title: responseDto.title,
    visibility: responseDto.visibility,
  }
}

function mapContestDetail(responseDto: ContestDetailResponseDto): ContestDetail {
  return {
    ...mapContestListItem(responseDto),
    isParticipant: responseDto.isParticipant,
    isStaff: responseDto.isStaff,
    registrationMode: responseDto.registrationMode,
  }
}

function mapContestProblemListItem(
  responseDto: ContestProblemListItemResponseDto,
): ContestProblemListItem {
  return {
    displayOrder: responseDto.displayOrder,
    id: responseDto.id,
    label: responseDto.label,
    score: responseDto.score,
    solvedStatus: responseDto.solvedStatus,
    title: responseDto.title,
  }
}

function mapContestProblemDetail(
  responseDto: ContestProblemDetailResponseDto,
): ContestProblemDetail {
  return {
    constraints: responseDto.constraints,
    displayOrder: responseDto.displayOrder,
    exampleTestCases: responseDto.exampleTestCases.map((testCaseDto) => ({
      caseOrder: testCaseDto.caseOrder,
      input: testCaseDto.input,
      output: testCaseDto.output,
    })),
    id: responseDto.id,
    inputDescription: responseDto.inputDescription,
    label: responseDto.label,
    memoryLimitKb: responseDto.memoryLimitKb,
    outputDescription: responseDto.outputDescription,
    score: responseDto.score,
    statement: responseDto.statement,
    timeLimitMillis: responseDto.timeLimitMillis,
    title: responseDto.title,
  }
}

function mapContestSubmission(
  responseDto: ContestSubmissionListItemResponseDto,
): ContestSubmission {
  return {
    contestProblemId: responseDto.contestProblemId,
    id: responseDto.id,
    language: responseDto.language,
    problemLabel: responseDto.problemLabel,
    scorePercentage: responseDto.scorePercentage ?? null,
    status: responseDto.status,
    submittedAt: formatContestDateTime(responseDto.submittedAt),
    submitterServiceUsername: responseDto.submitterServiceUsername,
  }
}

function mapContestCreatedSubmission(
  responseDto: ContestSubmissionResponseDto,
): ContestCreatedSubmission {
  return {
    contestId: responseDto.contestId,
    contestProblemId: responseDto.contestProblemId,
    id: responseDto.id,
    language: responseDto.language,
    problemLabel: responseDto.problemLabel,
    status: responseDto.status,
    submittedAt: formatContestDateTime(responseDto.submittedAt),
  }
}

function mapContestScoreboard(responseDto: ContestScoreboardResponseDto): ContestScoreboard {
  return {
    contestId: responseDto.contestId,
    problems: responseDto.problems.map(mapContestProblemListItem),
    rows: responseDto.rows.map((rowDto) => ({
      cells: rowDto.cells.map((cellDto) => ({
        attempts: cellDto.attempts,
        contestProblemId: cellDto.contestProblemId,
        firstSolved: cellDto.firstSolved,
        penalty: cellDto.penalty ?? null,
        problemLabel: cellDto.problemLabel,
        solved: cellDto.solved,
      })),
      lastAcceptedAt: rowDto.lastAcceptedAt
        ? formatContestDateTime(rowDto.lastAcceptedAt)
        : null,
      participantId: rowDto.participantId,
      penalty: rowDto.penalty,
      serviceUsername: rowDto.serviceUsername,
      solvedCount: rowDto.solvedCount,
    })),
  }
}

function mapContestProblemFormValue(
  formValue: ContestProblemFormValue,
): ContestProblemMutationRequestDto {
  return {
    constraints: formValue.constraints,
    displayOrder: formValue.displayOrder,
    inputDescription: formValue.inputDescription,
    label: formValue.label,
    memoryLimitKb: formValue.memoryLimitKb,
    outputDescription: formValue.outputDescription,
    score: formValue.score,
    statement: formValue.statement,
    testCases: formValue.testCases.map((testCase) => ({
      caseOrder: testCase.caseOrder,
      inputText: testCase.inputText,
      kind: testCase.kind,
      outputText: testCase.outputText,
    })),
    timeLimitMillis: formValue.timeLimitMillis,
    title: formValue.title,
  }
}

/** 공개 Contest 목록 API 응답을 대회 목록 화면 모델로 변환한다. */
export function useContestList(): {
  contests: ContestListItem[]
  errorMessage: string | null
  isLoading: boolean
} {
  const { isAuthenticated, requestWithFreshSession } = useAuth()
  const [contests, setContests] = useState<ContestListItem[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadContests(): Promise<void> {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const responseDto = await requestMaybeWithFreshSession(
          isAuthenticated,
          requestWithFreshSession,
          (accessToken) => getContests(accessToken),
        )

        if (isActive) {
          setContests(responseDto.map(mapContestListItem))
        }
      } catch (error) {
        if (isActive) {
          setContests([])
          setErrorMessage(getContestErrorMessage(error, '대회 목록을 불러오지 못했습니다.'))
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadContests()

    return () => {
      isActive = false
    }
  }, [isAuthenticated, requestWithFreshSession])

  return { contests, errorMessage, isLoading }
}

/** 대회 상세와 현재 사용자의 참가/운영진 상태를 조회한다. */
export function useContest(
  contestId: string | undefined,
  refreshKey = 0,
): {
  contest: ContestDetail | null
  errorMessage: string | null
  isLoading: boolean
} {
  const { isAuthenticated, requestWithFreshSession } = useAuth()
  const [contest, setContest] = useState<ContestDetail | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadContest(): Promise<void> {
      if (!contestId) {
        setContest(null)
        setErrorMessage('대회 ID가 올바르지 않습니다.')
        setIsLoading(false)

        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const responseDto = await requestMaybeWithFreshSession(
          isAuthenticated,
          requestWithFreshSession,
          (accessToken) => getContest(contestId, accessToken),
        )

        if (isActive) {
          setContest(mapContestDetail(responseDto))
        }
      } catch (error) {
        if (isActive) {
          setContest(null)
          setErrorMessage(getContestErrorMessage(error, '대회 정보를 불러오지 못했습니다.'))
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadContest()

    return () => {
      isActive = false
    }
  }, [contestId, isAuthenticated, refreshKey, requestWithFreshSession])

  return { contest, errorMessage, isLoading }
}

/** 대회 문제 목록 API 응답을 문제 목록 화면 모델로 변환한다. */
export function useContestProblems(
  contestId: string | undefined,
  refreshKey = 0,
): {
  errorMessage: string | null
  isLoading: boolean
  problems: ContestProblemListItem[]
} {
  const { isAuthenticated, requestWithFreshSession } = useAuth()
  const [problems, setProblems] = useState<ContestProblemListItem[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadContestProblems(): Promise<void> {
      if (!contestId) {
        setProblems([])
        setErrorMessage('대회 ID가 올바르지 않습니다.')
        setIsLoading(false)

        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const responseDto = await requestMaybeWithFreshSession(
          isAuthenticated,
          requestWithFreshSession,
          (accessToken) => getContestProblems(contestId, accessToken),
        )

        if (isActive) {
          setProblems(
            responseDto
              .map(mapContestProblemListItem)
              .sort((leftProblem, rightProblem) => leftProblem.displayOrder - rightProblem.displayOrder),
          )
        }
      } catch (error) {
        if (isActive) {
          setProblems([])
          setErrorMessage(getContestErrorMessage(error, '대회 문제 목록을 불러오지 못했습니다.'))
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadContestProblems()

    return () => {
      isActive = false
    }
  }, [contestId, isAuthenticated, refreshKey, requestWithFreshSession])

  return { errorMessage, isLoading, problems }
}

/** 대회 문제 상세 API 응답을 제출 화면 모델로 변환한다. */
export function useContestProblem(
  contestId: string | undefined,
  contestProblemId: string | undefined,
): {
  errorMessage: string | null
  isLoading: boolean
  problem: ContestProblemDetail | null
} {
  const { isAuthenticated, requestWithFreshSession } = useAuth()
  const [problem, setProblem] = useState<ContestProblemDetail | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadContestProblem(): Promise<void> {
      if (!contestId || !contestProblemId) {
        setProblem(null)
        setErrorMessage('대회 문제 ID가 올바르지 않습니다.')
        setIsLoading(false)

        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const responseDto = await requestMaybeWithFreshSession(
          isAuthenticated,
          requestWithFreshSession,
          (accessToken) => getContestProblem(contestId, contestProblemId, accessToken),
        )

        if (isActive) {
          setProblem(mapContestProblemDetail(responseDto))
        }
      } catch (error) {
        if (isActive) {
          setProblem(null)
          setErrorMessage(getContestErrorMessage(error, '대회 문제를 불러오지 못했습니다.'))
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadContestProblem()

    return () => {
      isActive = false
    }
  }, [contestId, contestProblemId, isAuthenticated, requestWithFreshSession])

  return { errorMessage, isLoading, problem }
}

/** 대회 참가 요청을 수행한다. 성공 후 호출자가 대회 상세을 다시 조회한다. */
export function useJoinContest(): {
  joinContestWithCurrentSession: (contestId: string) => Promise<void>
} {
  const { isAuthenticated, requestWithFreshSession } = useAuth()

  const joinContestWithCurrentSession = useCallback(
    async (contestId: string): Promise<void> => {
      if (!isAuthenticated) {
        throw createMissingSessionError()
      }

      await requestWithFreshSession((accessToken) => joinContest(accessToken, contestId))
    },
    [isAuthenticated, requestWithFreshSession],
  )

  return { joinContestWithCurrentSession }
}

/** 운영진 전용 ContestProblem 생성/수정/삭제 요청을 수행한다. */
export function useContestProblemMutations(): {
  createProblemWithCurrentSession: (
    contestId: string,
    formValue: ContestProblemFormValue,
  ) => Promise<void>
  deleteProblemWithCurrentSession: (
    contestId: string,
    contestProblemId: string,
  ) => Promise<void>
  updateProblemWithCurrentSession: (
    contestId: string,
    contestProblemId: string,
    formValue: ContestProblemFormValue,
  ) => Promise<void>
} {
  const { isAuthenticated, requestWithFreshSession } = useAuth()

  const requireSession = useCallback((): void => {
    if (!isAuthenticated) {
      throw createMissingSessionError()
    }
  }, [isAuthenticated])

  const createProblemWithCurrentSession = useCallback(
    async (contestId: string, formValue: ContestProblemFormValue): Promise<void> => {
      requireSession()

      await requestWithFreshSession((accessToken) =>
        createContestProblem(accessToken, contestId, mapContestProblemFormValue(formValue)),
      )
    },
    [requestWithFreshSession, requireSession],
  )

  const updateProblemWithCurrentSession = useCallback(
    async (
      contestId: string,
      contestProblemId: string,
      formValue: ContestProblemFormValue,
    ): Promise<void> => {
      requireSession()

      await requestWithFreshSession((accessToken) =>
        updateContestProblem(
          accessToken,
          contestId,
          contestProblemId,
          mapContestProblemFormValue(formValue),
        ),
      )
    },
    [requestWithFreshSession, requireSession],
  )

  const deleteProblemWithCurrentSession = useCallback(
    async (contestId: string, contestProblemId: string): Promise<void> => {
      requireSession()

      await requestWithFreshSession((accessToken) =>
        deleteContestProblem(accessToken, contestId, contestProblemId),
      )
    },
    [requestWithFreshSession, requireSession],
  )

  return {
    createProblemWithCurrentSession,
    deleteProblemWithCurrentSession,
    updateProblemWithCurrentSession,
  }
}

/** 대회 문제 제출 요청을 수행한다. */
export function useSubmitContestProblem(): {
  submitProblemWithCurrentSession: (
    contestId: string,
    contestProblemId: string,
    payload: ContestSubmissionRequestDto,
  ) => Promise<ContestCreatedSubmission>
} {
  const { isAuthenticated, requestWithFreshSession } = useAuth()

  const submitProblemWithCurrentSession = useCallback(
    async (
      contestId: string,
      contestProblemId: string,
      payload: ContestSubmissionRequestDto,
    ): Promise<ContestCreatedSubmission> => {
      if (!isAuthenticated) {
        throw createMissingSessionError()
      }

      const responseDto = await requestWithFreshSession((accessToken) =>
        submitContestProblem(accessToken, contestId, contestProblemId, payload),
      )

      return mapContestCreatedSubmission(responseDto)
    },
    [isAuthenticated, requestWithFreshSession],
  )

  return { submitProblemWithCurrentSession }
}

/** 대회 제출 목록을 조회하며, 채점 중인 제출이 있으면 선택적으로 polling한다. */
export function useContestSubmissions(
  contestId: string | undefined,
  scope: ContestSubmissionScope,
  refreshKey = 0,
  shouldPoll = false,
): {
  errorMessage: string | null
  isLoading: boolean
  isPolling: boolean
  submissions: ContestSubmission[]
} {
  const { isAuthenticated, requestWithFreshSession } = useAuth()
  const [submissions, setSubmissions] = useState<ContestSubmission[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    const currentContestId = contestId
    let isActive = true
    let pollingTimeoutId: ReturnType<typeof setTimeout> | null = null

    async function loadContestSubmissions(isInitialLoad: boolean): Promise<void> {
      if (!isAuthenticated) {
        setSubmissions([])
        setErrorMessage('로그인 후 제출 목록을 확인할 수 있습니다.')
        setIsLoading(false)
        setIsPolling(false)

        return
      }

      if (!currentContestId) {
        setSubmissions([])
        setErrorMessage('대회 ID가 올바르지 않습니다.')
        setIsLoading(false)
        setIsPolling(false)

        return
      }

      if (isInitialLoad) {
        setIsLoading(true)
      }

      setErrorMessage(null)

      try {
        const responseDto = await requestWithFreshSession((accessToken) =>
          scope === 'all'
            ? getContestSubmissions(accessToken, currentContestId)
            : getMyContestSubmissions(accessToken, currentContestId),
        )
        const nextSubmissions = responseDto.map(mapContestSubmission)
        const hasPendingSubmission = nextSubmissions.some((submission) =>
          pendingContestSubmissionStatuses.has(submission.status),
        )

        if (!isActive) {
          return
        }

        setSubmissions(nextSubmissions)
        setIsPolling(shouldPoll && hasPendingSubmission)

        if (shouldPoll && hasPendingSubmission) {
          pollingTimeoutId = setTimeout(() => {
            void loadContestSubmissions(false)
          }, contestSubmissionPollingIntervalMillis)
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(getContestErrorMessage(error, '대회 제출 목록을 불러오지 못했습니다.'))
        }
      } finally {
        if (isActive && isInitialLoad) {
          setIsLoading(false)
        }
      }
    }

    void loadContestSubmissions(true)

    return () => {
      isActive = false

      if (pollingTimeoutId) {
        clearTimeout(pollingTimeoutId)
      }
    }
  }, [contestId, isAuthenticated, refreshKey, requestWithFreshSession, scope, shouldPoll])

  return { errorMessage, isLoading, isPolling, submissions }
}

/** 대회 스코어보드 API 응답을 ICPC 테이블 화면 모델로 변환한다. */
export function useContestScoreboard(
  contestId: string | undefined,
  refreshKey = 0,
): {
  errorMessage: string | null
  isLoading: boolean
  scoreboard: ContestScoreboard | null
} {
  const { isAuthenticated, requestWithFreshSession } = useAuth()
  const [scoreboard, setScoreboard] = useState<ContestScoreboard | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadScoreboard(): Promise<void> {
      if (!contestId) {
        setScoreboard(null)
        setErrorMessage('대회 ID가 올바르지 않습니다.')
        setIsLoading(false)

        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const responseDto = await requestMaybeWithFreshSession(
          isAuthenticated,
          requestWithFreshSession,
          (accessToken) => getContestScoreboard(contestId, accessToken),
        )

        if (isActive) {
          setScoreboard(mapContestScoreboard(responseDto))
        }
      } catch (error) {
        if (isActive) {
          setScoreboard(null)
          setErrorMessage(getContestErrorMessage(error, '스코어보드를 불러오지 못했습니다.'))
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadScoreboard()

    return () => {
      isActive = false
    }
  }, [contestId, isAuthenticated, refreshKey, requestWithFreshSession])

  return { errorMessage, isLoading, scoreboard }
}
