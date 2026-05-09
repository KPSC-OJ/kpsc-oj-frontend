import type { SubmissionLanguageDto } from './submissionApi'

export type SubmissionSummary = {
  id: string
  problemNumber: number
  language: SubmissionLanguageDto
  status: string
  scorePercentage: number | null
  submittedAt: string
}

export type SubmissionPage = {
  page: number
  pageSize: number
  totalElements: number
  totalPages: number
  submissions: SubmissionSummary[]
}

export type SubmissionDetail = {
  id: string
  problemNumber: number
  language: SubmissionLanguageDto
  status: string
  scorePercentage: number | null
  submittedAt: string
  sourceCode: string
  compileErrorMessage: string | null
  runtimeErrorMessage: string | null
}
