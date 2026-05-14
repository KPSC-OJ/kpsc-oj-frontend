export type ProblemSummary = {
  problemNumber: number
  title: string
  tag: string
  timeLimitSeconds: number
  memoryLimitMegabytes: number
}

export type ProblemListItem = ProblemSummary & {
  canEdit: boolean
  createdByServiceUsername: string
}

export type ProblemExample = {
  order: number
  input: string
  output: string
}

export type ProblemSubtaskTestCaseMetadata = {
  order: number
}

export type ProblemSubtask = {
  order: number
  title: string
  score: number
  testCases: ProblemSubtaskTestCaseMetadata[]
}

export type ProblemDetail = ProblemSummary & {
  statementMarkdown: string
  exampleTestCases: ProblemExample[]
  subtasks: ProblemSubtask[]
}

export type ProblemSubtaskTestCaseDefinition = {
  order: number
  input: string
  output: string
}

export type ProblemSubtaskDefinition = {
  order: number
  title: string
  score: number
  testCases: ProblemSubtaskTestCaseDefinition[]
}

export type ProblemDefinition = ProblemSummary & {
  id: string
  statementMarkdown: string
  checkerCode: string | null
  exampleInputs: string[]
  exampleOutputs: string[]
  actualTestCaseInputs: string[]
  actualTestCaseOutputs: string[]
  subtasks: ProblemSubtaskDefinition[]
}

export type ProblemPage = {
  page: number
  pageSize: number
  totalElements: number
  totalPages: number
  problems: ProblemListItem[]
}
