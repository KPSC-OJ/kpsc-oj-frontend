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

export type SubmissionSubtaskResultResponseDto = {
  order: number
  title: string
  status: string
  score: number
  maxScore: number
}

export type SubmissionDetailResponseDto = {
  id: string
  problemNumber: number
  language: SubmissionLanguageDto
  status: string
  scorePercentage?: number | null
  totalScore?: number | null
  submittedAt: string
  sourceCode: string
  compileErrorMessage?: string | null
  runtimeErrorMessage?: string | null
  subtaskResults: SubmissionSubtaskResultResponseDto[]
}
