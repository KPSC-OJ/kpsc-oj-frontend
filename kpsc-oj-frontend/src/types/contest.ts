import type {
  ContestProblemSolvedStatusDto,
  ContestProblemTestCaseKindDto,
  ContestRegistrationModeDto,
  ContestStatusDto,
  ContestVisibilityDto,
} from './contestApi'
import type { SubmissionLanguageDto } from './submissionApi'

export type ContestListItem = {
  description: string
  endTime: string
  id: string
  startTime: string
  status: ContestStatusDto
  title: string
  visibility: ContestVisibilityDto
}

export type ContestDetail = ContestListItem & {
  isParticipant: boolean
  isStaff: boolean
  registrationMode: ContestRegistrationModeDto
}

export type ContestProblemListItem = {
  displayOrder: number
  id: string
  label: string
  score: number
  solvedStatus: ContestProblemSolvedStatusDto
  title: string
}

export type ContestProblemExampleTestCase = {
  caseOrder: number
  input: string
  output: string
}

export type ContestProblemDetail = {
  constraints: string
  displayOrder: number
  exampleTestCases: ContestProblemExampleTestCase[]
  id: string
  inputDescription: string
  label: string
  memoryLimitKb: number
  outputDescription: string
  score: number
  statement: string
  timeLimitMillis: number
  title: string
}

export type ContestProblemFormTestCase = {
  caseOrder: number
  inputText: string
  kind: ContestProblemTestCaseKindDto
  outputText: string
}

export type ContestProblemFormValue = {
  constraints: string
  displayOrder: number
  inputDescription: string
  label: string
  memoryLimitKb: number
  outputDescription: string
  score: number
  statement: string
  testCases: ContestProblemFormTestCase[]
  timeLimitMillis: number
  title: string
}

export type ContestSubmission = {
  contestProblemId: string
  id: string
  language: SubmissionLanguageDto
  problemLabel: string
  scorePercentage: number | null
  status: string
  submittedAt: string
  submitterServiceUsername: string
}

export type ContestCreatedSubmission = {
  contestId: string
  contestProblemId: string
  id: string
  language: SubmissionLanguageDto
  problemLabel: string
  status: string
  submittedAt: string
}

export type ContestScoreboardProblem = ContestProblemListItem

export type ContestScoreboardCell = {
  attempts: number
  contestProblemId: string
  firstSolved: boolean
  penalty: number | null
  problemLabel: string
  solved: boolean
}

export type ContestScoreboardRow = {
  cells: ContestScoreboardCell[]
  lastAcceptedAt: string | null
  participantId: string
  penalty: number
  serviceUsername: string
  solvedCount: number
}

export type ContestScoreboard = {
  contestId: string
  problems: ContestScoreboardProblem[]
  rows: ContestScoreboardRow[]
}
