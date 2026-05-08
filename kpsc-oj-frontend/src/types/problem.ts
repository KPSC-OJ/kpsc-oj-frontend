export type ProblemSummary = {
  problemNumber: number
  title: string
  tag: string
  timeLimitSeconds: number
  memoryLimitMegabytes: number
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

export type ProblemPage = {
  page: number
  pageSize: number
  totalElements: number
  totalPages: number
  problems: ProblemSummary[]
}
