export type CreateProblemRequestDto = {
  title: string
  tag: string
  timeLimitSeconds: number
  memoryLimitMegabytes: number
  statementMarkdown: string
  checkerCode?: string | null
  exampleInputs: string[]
  exampleOutputs: string[]
  actualTestCaseInputs: string[]
  actualTestCaseOutputs: string[]
}

export type CreateProblemResponseDto = {
  id: string
  problemNumber: number
  title: string
  tag: string
  timeLimitSeconds: number
  memoryLimitMegabytes: number
  exampleTestCaseCount: number
  actualTestCaseCount: number
}

export type ProblemListItemDto = {
  problemNumber: number
  title: string
  tag: string
  timeLimitSeconds: number
  memoryLimitMegabytes: number
}

export type ProblemListResponseDto = {
  page: number
  pageSize: number
  totalElements: number
  totalPages: number
  problems: ProblemListItemDto[]
}

export type ProblemExampleTestCaseDto = {
  order: number
  input: string
  output: string
}

export type ProblemDetailResponseDto = {
  problemNumber: number
  title: string
  tag: string
  timeLimitSeconds: number
  memoryLimitMegabytes: number
  statementMarkdown: string
  exampleTestCases: ProblemExampleTestCaseDto[]
}
