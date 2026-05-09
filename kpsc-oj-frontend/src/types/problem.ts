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

export type ProblemDetail = ProblemSummary & {
  statementMarkdown: string
  exampleTestCases: ProblemExample[]
}

export type ProblemDefinition = ProblemSummary & {
  id: string
  statementMarkdown: string
  checkerCode: string | null
  exampleInputs: string[]
  exampleOutputs: string[]
  actualTestCaseInputs: string[]
  actualTestCaseOutputs: string[]
}

export type ProblemPage = {
  page: number
  pageSize: number
  totalElements: number
  totalPages: number
  problems: ProblemListItem[]
}
