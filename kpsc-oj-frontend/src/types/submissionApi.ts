export type SubmissionLanguageDto = 'cpp17' | 'python3'

export type CreateSubmissionRequestDto = {
  problemNumber: number
  language: SubmissionLanguageDto
  sourceCode: string
}

export type CreateSubmissionResponseDto = {
  id: string
  problemNumber: number
  language: SubmissionLanguageDto
  status: string
  submittedAt: string
}

export type MySubmissionListItemDto = {
  id: string
  problemNumber: number
  language: SubmissionLanguageDto
  status: string
  scorePercentage?: number | null
  submittedAt: string
}

export type MySubmissionListResponseDto = {
  page: number
  pageSize: number
  totalElements: number
  totalPages: number
  submissions: MySubmissionListItemDto[]
}

export type SubmissionTestCaseResultDto = {
  order: number
  status: string
  executionTimeMillis?: number | null
  memoryUsageKilobytes?: number | null
  message?: string | null
}

export type SubmissionDetailResponseDto = {
  id: string
  problemNumber: number
  language: SubmissionLanguageDto
  status: string
  scorePercentage?: number | null
  submittedAt: string
  sourceCode: string
  testCaseResults: SubmissionTestCaseResultDto[]
  compileErrorMessage?: string | null
  runtimeErrorMessage?: string | null
}
