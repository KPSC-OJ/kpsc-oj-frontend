export type ProblemMutationRequestDto = {
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

export type CreateProblemRequestDto = ProblemMutationRequestDto

export type UpdateProblemRequestDto = ProblemMutationRequestDto

export type ProblemMutationResponseDto = {
  id: string
  problemNumber: number
  title: string
  tag: string
  timeLimitSeconds: number
  memoryLimitMegabytes: number
  exampleTestCaseCount: number
  actualTestCaseCount: number
}

export type CreateProblemResponseDto = ProblemMutationResponseDto

export type UpdateProblemResponseDto = ProblemMutationResponseDto

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

export type ProblemDefinitionResponseDto = {
  id: string
  problemNumber: number
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
