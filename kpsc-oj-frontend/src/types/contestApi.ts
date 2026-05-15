import type { SubmissionLanguageDto } from './submissionApi'

export type ContestVisibilityDto = 'PUBLIC' | 'PRIVATE'

export type ContestRegistrationModeDto = 'OPEN' | 'STAFF_ONLY'

export type ContestStatusDto = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'ENDED'

export type ContestProblemSolvedStatusDto = 'NOT_SUBMITTED' | 'ATTEMPTED' | 'SOLVED'

export type ContestProblemTestCaseKindDto = 'EXAMPLE' | 'HIDDEN'

export type ContestListItemResponseDto = {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  status: ContestStatusDto
  visibility: ContestVisibilityDto
}

export type ContestDetailResponseDto = ContestListItemResponseDto & {
  registrationMode: ContestRegistrationModeDto
  isStaff: boolean
  isParticipant: boolean
}

export type ContestJoinResponseDto = {
  contestId: string
  joined: boolean
}

export type ContestProblemListItemResponseDto = {
  id: string
  label: string
  title: string
  score: number
  displayOrder: number
  solvedStatus: ContestProblemSolvedStatusDto
}

export type ContestProblemExampleTestCaseResponseDto = {
  caseOrder: number
  input: string
  output: string
}

export type ContestProblemDetailResponseDto = {
  id: string
  label: string
  title: string
  statement: string
  inputDescription: string
  outputDescription: string
  constraints: string
  timeLimitMillis: number
  memoryLimitKb: number
  score: number
  displayOrder: number
  exampleTestCases: ContestProblemExampleTestCaseResponseDto[]
}

export type ContestProblemTestCaseRequestDto = {
  caseOrder: number
  kind: ContestProblemTestCaseKindDto
  inputText: string
  outputText: string
}

export type ContestProblemMutationRequestDto = {
  label: string
  title: string
  statement: string
  inputDescription: string
  outputDescription: string
  constraints: string
  timeLimitMillis: number
  memoryLimitKb: number
  score: number
  displayOrder: number
  testCases: ContestProblemTestCaseRequestDto[]
}

export type ContestProblemMutationResponseDto = {
  id: string
  contestId: string
  label: string
  title: string
  score: number
  displayOrder: number
  exampleTestCaseCount: number
  hiddenTestCaseCount: number
}

export type ContestSubmissionRequestDto = {
  language: SubmissionLanguageDto
  sourceCode: string
}

export type ContestSubmissionResponseDto = {
  id: string
  contestId: string
  contestProblemId: string
  problemLabel: string
  language: SubmissionLanguageDto
  status: string
  submittedAt: string
}

export type ContestSubmissionListItemResponseDto = {
  id: string
  contestProblemId: string
  problemLabel: string
  submitterServiceUsername: string
  language: SubmissionLanguageDto
  status: string
  scorePercentage?: number | null
  submittedAt: string
}

export type ContestScoreboardProblemResponseDto = ContestProblemListItemResponseDto

export type ContestScoreboardCellResponseDto = {
  contestProblemId: string
  problemLabel: string
  attempts: number
  solved: boolean
  penalty?: number | null
  firstSolved: boolean
}

export type ContestScoreboardRowResponseDto = {
  participantId: string
  serviceUsername: string
  solvedCount: number
  penalty: number
  lastAcceptedAt?: string | null
  cells: ContestScoreboardCellResponseDto[]
}

export type ContestScoreboardResponseDto = {
  contestId: string
  problems: ContestScoreboardProblemResponseDto[]
  rows: ContestScoreboardRowResponseDto[]
}
