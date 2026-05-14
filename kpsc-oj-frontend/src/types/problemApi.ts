export type ProblemSubtaskTestCaseRequestDto = {
  input: string
  output: string
}

export type ProblemSubtaskRequestDto = {
  order: number
  title: string
  score: number
  prerequisiteSubtaskOrders?: number[]
  testCases: ProblemSubtaskTestCaseRequestDto[]
}

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
  subtasks?: ProblemSubtaskRequestDto[]
}

export type CreateProblemRequestDto = ProblemMutationRequestDto & {
  referenceSolutionCode: string
}

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
  createdByServiceUsername: string
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

export type ProblemSubtaskTestCaseMetadataDto = {
  order: number
}

export type ProblemSubtaskDto = {
  order: number
  title: string
  score: number
  prerequisiteSubtaskOrders: number[]
  testCases: ProblemSubtaskTestCaseMetadataDto[]
}

export type ProblemDetailResponseDto = {
  problemNumber: number
  title: string
  tag: string
  timeLimitSeconds: number
  memoryLimitMegabytes: number
  statementMarkdown: string
  exampleTestCases: ProblemExampleTestCaseDto[]
  subtasks: ProblemSubtaskDto[]
}

export type ProblemSubtaskTestCaseDefinitionDto = {
  order: number
  input: string
  output: string
}

export type ProblemSubtaskDefinitionDto = {
  order: number
  title: string
  score: number
  prerequisiteSubtaskOrders: number[]
  testCases: ProblemSubtaskTestCaseDefinitionDto[]
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
  subtasks: ProblemSubtaskDefinitionDto[]
}
