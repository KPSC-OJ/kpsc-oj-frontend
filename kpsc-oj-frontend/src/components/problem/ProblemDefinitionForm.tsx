import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from 'react'
import { CheckCircle2, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { CheckerGuide } from './CheckerGuide'
import type { AuthApiError } from '../../types/auth'
import type {
  CreateProblemRequestDto,
  ProblemMutationRequestDto,
  ProblemSubtaskRequestDto,
  UpdateProblemRequestDto,
} from '../../types/problemApi'
import type { ProblemSubtaskDefinition } from '../../types/problem'

export type ProblemDefinitionFormInitialValue = {
  checkerCode?: string | null
  memoryLimitMegabytes: number
  statementMarkdown: string
  tag: string
  timeLimitSeconds: number
  title: string
  exampleInputs: string[]
  exampleOutputs: string[]
  actualTestCaseInputs: string[]
  actualTestCaseOutputs: string[]
  subtasks?: ProblemSubtaskDefinition[]
}

export type ProblemDefinitionFormSaveResult = {
  actualTestCaseCount: number
  exampleTestCaseCount: number
  title: string
}

type ProblemDefinitionFormBaseProps = {
  description: string
  eyebrow: string
  forbiddenErrorMessage: string
  initialValue?: ProblemDefinitionFormInitialValue
  resetOnSuccess?: boolean
  submitErrorFallback: string
  submitLabel: string
  submittingLabel: string
  successTitle: string
  title: string
}

type ProblemDefinitionFormCreateProps = ProblemDefinitionFormBaseProps & {
  onSubmit: (
    requestDto: CreateProblemRequestDto,
  ) => Promise<ProblemDefinitionFormSaveResult>
  requiresReferenceSolution: true
}

type ProblemDefinitionFormUpdateProps = ProblemDefinitionFormBaseProps & {
  onSubmit: (
    requestDto: UpdateProblemRequestDto,
  ) => Promise<ProblemDefinitionFormSaveResult>
  requiresReferenceSolution?: false
}

type ProblemDefinitionFormProps =
  | ProblemDefinitionFormCreateProps
  | ProblemDefinitionFormUpdateProps

type ProblemFormState = {
  checkerCode: string
  memoryLimitMegabytes: string
  referenceSolutionCode: string
  statementMarkdown: string
  tag: string
  timeLimitSeconds: string
  title: string
}

type TestCaseFormRow = {
  id: string
  input: string
  output: string
}

type TestCaseKind = 'example' | 'actual'

type SubtaskFormRow = {
  id: string
  prerequisiteSubtaskOrdersText: string
  title: string
  score: string
  testCases: TestCaseFormRow[]
}

type SubtaskField = 'title' | 'score' | 'prerequisiteSubtaskOrdersText'

type ParsedPrerequisiteOrders = {
  errorMessage: string | null
  orders: number[]
}

const emptyProblemFormState: ProblemFormState = {
  checkerCode: '',
  memoryLimitMegabytes: '128',
  referenceSolutionCode: '',
  statementMarkdown: '',
  tag: '',
  timeLimitSeconds: '1',
  title: '',
}

let testCaseSequence = 0
let subtaskSequence = 0

function createTestCaseRow(
  kind: TestCaseKind,
  input = '',
  output = '',
): TestCaseFormRow {
  testCaseSequence += 1

  return {
    id: `${kind}-${testCaseSequence}`,
    input,
    output,
  }
}

function createRowsFromValues(
  kind: TestCaseKind,
  inputs: string[],
  outputs: string[],
): TestCaseFormRow[] {
  const rowCount = Math.max(inputs.length, outputs.length, 1)

  return Array.from({ length: rowCount }, (_, index) =>
    createTestCaseRow(kind, inputs[index] ?? '', outputs[index] ?? ''),
  )
}

function createSubtaskRow(
  subtask?: ProblemSubtaskDefinition,
): SubtaskFormRow {
  subtaskSequence += 1

  return {
    id: `subtask-${subtaskSequence}`,
    prerequisiteSubtaskOrdersText:
      subtask?.prerequisiteSubtaskOrders.join(', ') ?? '',
    score: subtask ? String(subtask.score) : '',
    testCases:
      subtask?.testCases.map((testCase) =>
        createTestCaseRow('actual', testCase.input, testCase.output),
      ) ?? [createTestCaseRow('actual')],
    title: subtask?.title ?? '',
  }
}

function createSubtaskRows(initialValue?: ProblemDefinitionFormInitialValue): SubtaskFormRow[] {
  if (initialValue?.subtasks?.length) {
    return [...initialValue.subtasks]
      .sort((leftSubtask, rightSubtask) => leftSubtask.order - rightSubtask.order)
      .map(createSubtaskRow)
  }

  return [createSubtaskRow()]
}

function createFormState(initialValue?: ProblemDefinitionFormInitialValue): ProblemFormState {
  if (!initialValue) {
    return emptyProblemFormState
  }

  return {
    checkerCode: initialValue.checkerCode ?? '',
    memoryLimitMegabytes: String(initialValue.memoryLimitMegabytes),
    referenceSolutionCode: '',
    statementMarkdown: initialValue.statementMarkdown,
    tag: initialValue.tag,
    timeLimitSeconds: String(initialValue.timeLimitSeconds),
    title: initialValue.title,
  }
}

function parsePositiveInteger(value: string): number | null {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null
  }

  return parsedValue
}

function parsePrerequisiteSubtaskOrdersText(value: string): ParsedPrerequisiteOrders {
  if (!value.trim()) {
    return { errorMessage: null, orders: [] }
  }

  const orderTexts = value.split(',').map((orderText) => orderText.trim())

  if (orderTexts.some((orderText) => orderText.length === 0)) {
    return {
      errorMessage: '선행 서브테스크는 쉼표로 구분한 양의 정수로 입력해야 합니다.',
      orders: [],
    }
  }

  const orders: number[] = []

  for (const orderText of orderTexts) {
    const parsedOrder = parsePositiveInteger(orderText)

    if (!parsedOrder) {
      return {
        errorMessage: '선행 서브테스크는 쉼표로 구분한 양의 정수로 입력해야 합니다.',
        orders: [],
      }
    }

    if (orders.includes(parsedOrder)) {
      return {
        errorMessage: '같은 선행 서브테스크를 중복 입력할 수 없습니다.',
        orders: [],
      }
    }

    orders.push(parsedOrder)
  }

  return { errorMessage: null, orders }
}

function hasCyclicSubtaskPrerequisites(
  prerequisiteOrdersByOrder: Map<number, number[]>,
): boolean {
  const visitingOrders = new Set<number>()
  const visitedOrders = new Set<number>()

  function visitSubtask(order: number): boolean {
    if (visitingOrders.has(order)) {
      return true
    }

    if (visitedOrders.has(order)) {
      return false
    }

    visitingOrders.add(order)

    for (const prerequisiteOrder of prerequisiteOrdersByOrder.get(order) ?? []) {
      if (visitSubtask(prerequisiteOrder)) {
        return true
      }
    }

    visitingOrders.delete(order)
    visitedOrders.add(order)

    return false
  }

  return Array.from(prerequisiteOrdersByOrder.keys()).some(visitSubtask)
}

function getSubtaskPrerequisiteValidationMessage(
  subtasks: SubtaskFormRow[],
): string | null {
  const availableOrders = new Set(subtasks.map((_subtask, index) => index + 1))
  const prerequisiteOrdersByOrder = new Map<number, number[]>()

  for (const [index, subtask] of subtasks.entries()) {
    const subtaskOrder = index + 1
    const parsedPrerequisites = parsePrerequisiteSubtaskOrdersText(
      subtask.prerequisiteSubtaskOrdersText,
    )

    if (parsedPrerequisites.errorMessage) {
      return `서브테스크 ${subtaskOrder}: ${parsedPrerequisites.errorMessage}`
    }

    if (parsedPrerequisites.orders.includes(subtaskOrder)) {
      return `서브테스크 ${subtaskOrder}는 자기 자신을 선행 서브테스크로 지정할 수 없습니다.`
    }

    const missingOrder = parsedPrerequisites.orders.find(
      (prerequisiteOrder) => !availableOrders.has(prerequisiteOrder),
    )

    if (missingOrder) {
      return `서브테스크 ${subtaskOrder}의 선행 서브테스크 ${missingOrder}번이 존재하지 않습니다.`
    }

    prerequisiteOrdersByOrder.set(subtaskOrder, parsedPrerequisites.orders)
  }

  if (hasCyclicSubtaskPrerequisites(prerequisiteOrdersByOrder)) {
    return '서브테스크 선행 관계에 순환이 있습니다.'
  }

  return null
}

function hasInitialCheckerCode(initialValue?: ProblemDefinitionFormInitialValue): boolean {
  return Boolean(initialValue?.checkerCode?.trim())
}

function hasInitialSubtasks(initialValue?: ProblemDefinitionFormInitialValue): boolean {
  return Boolean(initialValue?.subtasks?.length)
}

function getSubmitErrorMessage(
  error: unknown,
  forbiddenErrorMessage: string,
  fallbackMessage: string,
): string {
  const apiError = error as Partial<AuthApiError>

  if (apiError.status === 403 || apiError.code === 'FORBIDDEN_OPERATION') {
    return forbiddenErrorMessage
  }

  if (apiError.status === 401 || apiError.code === 'AUTHENTICATION_FAILED') {
    return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  }

  if (apiError.status === 404 || apiError.code === 'PROBLEM_NOT_FOUND') {
    return '문제를 찾을 수 없습니다.'
  }

  if (apiError.code === 'PROBLEM_VERIFICATION_FAILED') {
    return '예시 정답 코드가 실제 채점 테스트 케이스를 통과하지 못했습니다. 코드와 기대 출력을 확인해주세요.'
  }

  if (apiError.status === 503 || apiError.code === 'JUDGE_UNAVAILABLE') {
    return 'judge 서버 문제로 예시 정답 코드 검증을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.'
  }

  if (typeof apiError.message === 'string') {
    return apiError.message
  }

  return fallbackMessage
}

function renderValidationMessage(
  formState: ProblemFormState,
  requiresReferenceSolution: boolean,
  usesSubtasks: boolean,
  subtasks: SubtaskFormRow[],
  timeLimitSeconds: number | null,
  memoryLimitMegabytes: number | null,
): string | null {
  if (!formState.title.trim()) {
    return '문제 제목을 입력해야 합니다.'
  }

  if (formState.title.trim().length > 20) {
    return '문제 제목은 20자 이하로 입력해야 합니다.'
  }

  if (!formState.tag.trim()) {
    return '문제 태그를 입력해야 합니다.'
  }

  if (formState.tag.trim().length > 64) {
    return '문제 태그는 64자 이하로 입력해야 합니다.'
  }

  if (!timeLimitSeconds) {
    return '시간 제한은 양의 정수로 입력해야 합니다.'
  }

  if (!memoryLimitMegabytes) {
    return '메모리 제한은 양의 정수로 입력해야 합니다.'
  }

  if (!formState.statementMarkdown.trim()) {
    return '문제 본문을 입력해야 합니다.'
  }

  if (requiresReferenceSolution && !formState.referenceSolutionCode.trim()) {
    return '예시 정답 C++17 코드를 입력해야 합니다.'
  }

  if (usesSubtasks) {
    const subtaskScoreSum = subtasks.reduce((sum, subtask) => {
      const parsedScore = parsePositiveInteger(subtask.score)

      return parsedScore === null ? sum : sum + parsedScore
    }, 0)

    for (const [index, subtask] of subtasks.entries()) {
      if (!subtask.title.trim()) {
        return `서브테스크 ${index + 1} 제목을 입력해야 합니다.`
      }

      if (subtask.title.trim().length > 64) {
        return `서브테스크 ${index + 1} 제목은 64자 이하로 입력해야 합니다.`
      }

      if (!parsePositiveInteger(subtask.score)) {
        return `서브테스크 ${index + 1} 배점은 양의 정수로 입력해야 합니다.`
      }

      if (subtask.testCases.length === 0) {
        return `서브테스크 ${index + 1}에 실제 채점 테스트 케이스가 필요합니다.`
      }
    }

    if (subtaskScoreSum !== 100) {
      return '서브테스크 배점 합은 정확히 100이어야 합니다.'
    }

    const prerequisiteValidationMessage =
      getSubtaskPrerequisiteValidationMessage(subtasks)

    if (prerequisiteValidationMessage) {
      return prerequisiteValidationMessage
    }
  }

  return null
}

function TestCaseEditor({
  kind,
  onAdd,
  onRemove,
  onUpdate,
  rows,
  title,
}: {
  kind: TestCaseKind
  onAdd: (kind: TestCaseKind) => void
  onRemove: (kind: TestCaseKind, id: string) => void
  onUpdate: (
    kind: TestCaseKind,
    id: string,
    field: 'input' | 'output',
    value: string,
  ) => void
  rows: TestCaseFormRow[]
  title: string
}): ReactElement {
  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">입력과 기대 출력을 같은 순서로 작성합니다.</p>
        </div>
        <Button onClick={() => onAdd(kind)} size="sm" type="button" variant="secondary">
          <Plus size={16} />
          케이스 추가
        </Button>
      </div>

      <div className="space-y-4">
        {rows.map((row, index) => (
          <div className="rounded-md border border-slate-200 p-4" key={row.id}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-700">케이스 {index + 1}</p>
              <Button
                disabled={rows.length === 1}
                onClick={() => onRemove(kind, row.id)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <Trash2 size={15} />
                삭제
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">입력</span>
                <textarea
                  className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-200 px-4 py-3 font-mono text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  onChange={(event) => onUpdate(kind, row.id, 'input', event.target.value)}
                  placeholder="입력이 없는 케이스는 비워둘 수 있습니다."
                  value={row.input}
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">출력</span>
                <textarea
                  className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-200 px-4 py-3 font-mono text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  onChange={(event) => onUpdate(kind, row.id, 'output', event.target.value)}
                  placeholder="기대 출력"
                  value={row.output}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function SubtaskEditor({
  onAdd,
  onAddTestCase,
  onRemove,
  onRemoveTestCase,
  onUpdate,
  onUpdateTestCase,
  rows,
}: {
  onAdd: () => void
  onAddTestCase: (subtaskId: string) => void
  onRemove: (subtaskId: string) => void
  onRemoveTestCase: (subtaskId: string, testCaseId: string) => void
  onUpdate: (subtaskId: string, field: SubtaskField, value: string) => void
  onUpdateTestCase: (
    subtaskId: string,
    testCaseId: string,
    field: 'input' | 'output',
    value: string,
  ) => void
  rows: SubtaskFormRow[]
}): ReactElement {
  const scoreSum = rows.reduce((sum, row) => {
    const parsedScore = parsePositiveInteger(row.score)

    return parsedScore === null ? sum : sum + parsedScore
  }, 0)

  return (
    <Card className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">서브테스크</h2>
          <p className="mt-1 text-sm text-slate-500">
            배점 합이 100이 되도록 작성하고, 각 서브테스크에 실제 채점 테스트 케이스와 선행 관계를 배정합니다.
          </p>
          <p
            className={[
              'mt-2 text-sm font-bold',
              scoreSum === 100 ? 'text-emerald-700' : 'text-amber-700',
            ].join(' ')}
          >
            현재 배점 합계 {scoreSum}점
          </p>
        </div>
        <Button onClick={onAdd} size="sm" type="button" variant="secondary">
          <Plus size={16} />
          서브테스크 추가
        </Button>
      </div>

      <div className="space-y-4">
        {rows.map((subtask, subtaskIndex) => (
          <section className="rounded-md border border-slate-200 p-4" key={subtask.id}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-700">
                서브테스크 {subtaskIndex + 1}
              </p>
              <Button
                disabled={rows.length === 1}
                onClick={() => onRemove(subtask.id)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <Trash2 size={15} />
                삭제
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_160px]">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">제목</span>
                <input
                  className="mt-2 w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  maxLength={64}
                  onChange={(event) => onUpdate(subtask.id, 'title', event.target.value)}
                  placeholder="예: 작은 입력"
                  value={subtask.title}
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">배점</span>
                <input
                  className="mt-2 w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  min={1}
                  onChange={(event) => onUpdate(subtask.id, 'score', event.target.value)}
                  type="number"
                  value={subtask.score}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  선행 서브테스크 order
                </span>
                <input
                  className="mt-2 w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  onChange={(event) =>
                    onUpdate(
                      subtask.id,
                      'prerequisiteSubtaskOrdersText',
                      event.target.value,
                    )
                  }
                  placeholder="예: 1, 2"
                  value={subtask.prerequisiteSubtaskOrdersText}
                />
                <span className="mt-1 block text-xs text-slate-500">
                  입력한 서브테스크가 통과되어야 이 서브테스크 점수를 받을 수 있습니다.
                </span>
              </label>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-800">실제 채점 테스트 케이스</h3>
                <Button
                  onClick={() => onAddTestCase(subtask.id)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Plus size={15} />
                  케이스 추가
                </Button>
              </div>

              {subtask.testCases.map((testCase, testCaseIndex) => (
                <div
                  className="rounded-md border border-slate-100 bg-slate-50 p-3"
                  key={testCase.id}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-600">
                      케이스 {testCaseIndex + 1}
                    </p>
                    <Button
                      disabled={subtask.testCases.length === 1}
                      onClick={() => onRemoveTestCase(subtask.id, testCase.id)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 size={15} />
                      삭제
                    </Button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">입력</span>
                      <textarea
                        className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-200 bg-white px-4 py-3 font-mono text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        onChange={(event) =>
                          onUpdateTestCase(
                            subtask.id,
                            testCase.id,
                            'input',
                            event.target.value,
                          )
                        }
                        placeholder="입력이 없는 케이스는 비워둘 수 있습니다."
                        value={testCase.input}
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-bold text-slate-700">출력</span>
                      <textarea
                        className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-200 bg-white px-4 py-3 font-mono text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        onChange={(event) =>
                          onUpdateTestCase(
                            subtask.id,
                            testCase.id,
                            'output',
                            event.target.value,
                          )
                        }
                        placeholder="기대 출력"
                        value={testCase.output}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Card>
  )
}

export function ProblemDefinitionForm(props: ProblemDefinitionFormProps): ReactElement {
  const {
    description,
    eyebrow,
    forbiddenErrorMessage,
    initialValue,
    resetOnSuccess = false,
    submitErrorFallback,
    submitLabel,
    submittingLabel,
    successTitle,
    title,
  } = props
  const requiresReferenceSolution = props.requiresReferenceSolution === true
  const [formState, setFormState] = useState<ProblemFormState>(() =>
    createFormState(initialValue),
  )
  const [usesCustomChecker, setUsesCustomChecker] = useState(() =>
    hasInitialCheckerCode(initialValue),
  )
  const [usesSubtasks, setUsesSubtasks] = useState(() => hasInitialSubtasks(initialValue))
  const [exampleCases, setExampleCases] = useState<TestCaseFormRow[]>(() =>
    createRowsFromValues(
      'example',
      initialValue?.exampleInputs ?? [],
      initialValue?.exampleOutputs ?? [],
    ),
  )
  const [actualCases, setActualCases] = useState<TestCaseFormRow[]>(() =>
    createRowsFromValues(
      'actual',
      initialValue?.actualTestCaseInputs ?? [],
      initialValue?.actualTestCaseOutputs ?? [],
    ),
  )
  const [subtasks, setSubtasks] = useState<SubtaskFormRow[]>(() =>
    createSubtaskRows(initialValue),
  )
  const [savedProblem, setSavedProblem] =
    useState<ProblemDefinitionFormSaveResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(
    field: keyof ProblemFormState,
  ): (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void {
    return (event) => {
      setFormState((currentState) => ({
        ...currentState,
        [field]: event.target.value,
      }))
    }
  }

  function addTestCase(kind: TestCaseKind): void {
    if (kind === 'example') {
      setExampleCases((currentRows) => [...currentRows, createTestCaseRow(kind)])

      return
    }

    setActualCases((currentRows) => [...currentRows, createTestCaseRow(kind)])
  }

  function removeTestCase(kind: TestCaseKind, id: string): void {
    if (kind === 'example') {
      setExampleCases((currentRows) =>
        currentRows.length === 1 ? currentRows : currentRows.filter((row) => row.id !== id),
      )

      return
    }

    setActualCases((currentRows) =>
      currentRows.length === 1 ? currentRows : currentRows.filter((row) => row.id !== id),
    )
  }

  function updateTestCase(
    kind: TestCaseKind,
    id: string,
    field: 'input' | 'output',
    value: string,
  ): void {
    const updateRow = (row: TestCaseFormRow): TestCaseFormRow =>
      row.id === id ? { ...row, [field]: value } : row

    if (kind === 'example') {
      setExampleCases((currentRows) => currentRows.map(updateRow))

      return
    }

    setActualCases((currentRows) => currentRows.map(updateRow))
  }

  function addSubtask(): void {
    setSubtasks((currentRows) => [...currentRows, createSubtaskRow()])
  }

  function removeSubtask(subtaskId: string): void {
    setSubtasks((currentRows) =>
      currentRows.length === 1
        ? currentRows
        : currentRows.filter((subtask) => subtask.id !== subtaskId),
    )
  }

  function updateSubtask(
    subtaskId: string,
    field: SubtaskField,
    value: string,
  ): void {
    setSubtasks((currentRows) =>
      currentRows.map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, [field]: value } : subtask,
      ),
    )
  }

  function addSubtaskTestCase(subtaskId: string): void {
    setSubtasks((currentRows) =>
      currentRows.map((subtask) =>
        subtask.id === subtaskId
          ? {
              ...subtask,
              testCases: [...subtask.testCases, createTestCaseRow('actual')],
            }
          : subtask,
      ),
    )
  }

  function removeSubtaskTestCase(subtaskId: string, testCaseId: string): void {
    setSubtasks((currentRows) =>
      currentRows.map((subtask) => {
        if (subtask.id !== subtaskId || subtask.testCases.length === 1) {
          return subtask
        }

        return {
          ...subtask,
          testCases: subtask.testCases.filter((testCase) => testCase.id !== testCaseId),
        }
      }),
    )
  }

  function updateSubtaskTestCase(
    subtaskId: string,
    testCaseId: string,
    field: 'input' | 'output',
    value: string,
  ): void {
    setSubtasks((currentRows) =>
      currentRows.map((subtask) => {
        if (subtask.id !== subtaskId) {
          return subtask
        }

        return {
          ...subtask,
          testCases: subtask.testCases.map((testCase) =>
            testCase.id === testCaseId ? { ...testCase, [field]: value } : testCase,
          ),
        }
      }),
    )
  }

  function resetForm(): void {
    setFormState(createFormState(initialValue))
    setUsesCustomChecker(hasInitialCheckerCode(initialValue))
    setUsesSubtasks(hasInitialSubtasks(initialValue))
    setExampleCases(
      createRowsFromValues(
        'example',
        initialValue?.exampleInputs ?? [],
        initialValue?.exampleOutputs ?? [],
      ),
    )
    setActualCases(
      createRowsFromValues(
        'actual',
        initialValue?.actualTestCaseInputs ?? [],
        initialValue?.actualTestCaseOutputs ?? [],
      ),
    )
    setSubtasks(createSubtaskRows(initialValue))
  }

  function createSubtaskRequestDtos(): ProblemSubtaskRequestDto[] {
    return subtasks.map((subtask, index) => ({
      order: index + 1,
      prerequisiteSubtaskOrders: parsePrerequisiteSubtaskOrdersText(
        subtask.prerequisiteSubtaskOrdersText,
      ).orders,
      score: parsePositiveInteger(subtask.score) ?? 0,
      testCases: subtask.testCases.map((testCase) => ({
        input: testCase.input,
        output: testCase.output,
      })),
      title: subtask.title.trim(),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setSavedProblem(null)
    setErrorMessage(null)

    const timeLimitSeconds = parsePositiveInteger(formState.timeLimitSeconds)
    const memoryLimitMegabytes = parsePositiveInteger(formState.memoryLimitMegabytes)
    const validationMessage = renderValidationMessage(
      formState,
      requiresReferenceSolution,
      usesSubtasks,
      subtasks,
      timeLimitSeconds,
      memoryLimitMegabytes,
    )

    if (validationMessage || !timeLimitSeconds || !memoryLimitMegabytes) {
      setErrorMessage(validationMessage ?? '제한 조건을 확인해주세요.')

      return
    }

    if (usesCustomChecker && !formState.checkerCode.trim()) {
      setErrorMessage('커스텀 checker를 사용하려면 C++17 checker 코드를 입력해야 합니다.')

      return
    }

    const checkerCode = usesCustomChecker ? formState.checkerCode : null
    const subtaskRequestDtos = usesSubtasks ? createSubtaskRequestDtos() : []
    const mutationRequestDto: ProblemMutationRequestDto = {
      actualTestCaseInputs: usesSubtasks
        ? []
        : actualCases.map((testCase) => testCase.input),
      actualTestCaseOutputs: usesSubtasks
        ? []
        : actualCases.map((testCase) => testCase.output),
      checkerCode,
      exampleInputs: exampleCases.map((testCase) => testCase.input),
      exampleOutputs: exampleCases.map((testCase) => testCase.output),
      memoryLimitMegabytes,
      statementMarkdown: formState.statementMarkdown,
      subtasks: subtaskRequestDtos,
      tag: formState.tag.trim(),
      timeLimitSeconds,
      title: formState.title.trim(),
    }

    setIsSubmitting(true)

    try {
      const nextSavedProblem =
        props.requiresReferenceSolution === true
          ? await props.onSubmit({
              ...mutationRequestDto,
              referenceSolutionCode: formState.referenceSolutionCode,
            })
          : await props.onSubmit(mutationRequestDto)

      setSavedProblem(nextSavedProblem)

      if (resetOnSuccess) {
        resetForm()
      }
    } catch (error) {
      setErrorMessage(
        getSubmitErrorMessage(error, forbiddenErrorMessage, submitErrorFallback),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold text-blue-600">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      {savedProblem ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-bold">{successTitle}</p>
              <p className="mt-1">
                {savedProblem.title} · 예제 {savedProblem.exampleTestCaseCount}개 · 실제 테스트{' '}
                {savedProblem.actualTestCaseCount}개
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">문제 제목</span>
              <input
                className="mt-2 w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                maxLength={20}
                onChange={updateField('title')}
                placeholder="20자 이하"
                required
                value={formState.title}
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">태그</span>
              <input
                className="mt-2 w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                maxLength={64}
                onChange={updateField('tag')}
                placeholder="math, implementation"
                required
                value={formState.tag}
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">시간 제한</span>
              <input
                className="mt-2 w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                min={1}
                onChange={updateField('timeLimitSeconds')}
                required
                type="number"
                value={formState.timeLimitSeconds}
              />
              <span className="mt-1 block text-xs text-slate-500">seconds 단위</span>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">메모리 제한</span>
              <input
                className="mt-2 w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                min={1}
                onChange={updateField('memoryLimitMegabytes')}
                required
                type="number"
                value={formState.memoryLimitMegabytes}
              />
              <span className="mt-1 block text-xs text-slate-500">MB 단위</span>
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-bold text-slate-700">문제 본문</span>
              <textarea
                className="mt-2 min-h-72 w-full resize-y rounded-md border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                onChange={updateField('statementMarkdown')}
                placeholder="Markdown으로 문제 설명, 입력, 출력, 제한 조건을 작성하세요."
                required
                value={formState.statementMarkdown}
              />
            </label>

            {requiresReferenceSolution ? (
              <label className="block md:col-span-2">
                <span className="text-sm font-bold text-slate-700">
                  예시 정답 C++17 코드
                </span>
                <textarea
                  className="mt-2 min-h-64 w-full resize-y rounded-md border border-slate-200 px-4 py-3 font-mono text-xs leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  onChange={updateField('referenceSolutionCode')}
                  placeholder="실제 채점 테스트 케이스를 모두 통과하는 C++17 전체 소스 코드를 입력하세요."
                  required
                  value={formState.referenceSolutionCode}
                />
                <span className="mt-1 block text-xs text-slate-500">
                  생성 요청에만 전송되며 저장되지 않습니다. 제출한 코드가 실제 채점 테스트를 통과해야 문제가 생성됩니다.
                </span>
              </label>
            ) : null}

            <div className="space-y-4 md:col-span-2">
              <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                <input
                  checked={usesCustomChecker}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  onChange={(event) => setUsesCustomChecker(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  <span className="block text-sm font-bold text-slate-800">
                    커스텀 checker 사용
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-500">
                    필수 항목이 아닙니다. 체크하지 않으면 judge가 expected output과 제출 stdout을 직접 비교합니다.
                  </span>
                </span>
              </label>

              {usesCustomChecker ? (
                <div className="space-y-4">
                  <CheckerGuide />
                  <div>
                    <label
                      className="text-sm font-bold text-slate-700"
                      htmlFor="checkerCode"
                    >
                      채점용 testlib checker C++ 코드
                    </label>
                    <textarea
                      id="checkerCode"
                      className="mt-2 min-h-56 w-full resize-y rounded-md border border-slate-200 px-4 py-3 font-mono text-xs leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      onChange={updateField('checkerCode')}
                      placeholder="C++17 전체 소스 코드를 입력하세요."
                      value={formState.checkerCode}
                    />
                    <span className="mt-1 block text-xs text-slate-500">
                      testlib.h를 include하고 registerTestlibCmd(argc, argv)로 초기화한 전체 C++17 소스를 입력하세요.
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        <TestCaseEditor
          kind="example"
          onAdd={addTestCase}
          onRemove={removeTestCase}
          onUpdate={updateTestCase}
          rows={exampleCases}
          title="공개 예제 테스트 케이스"
        />

        <Card>
          <label className="flex items-start gap-3">
            <input
              checked={usesSubtasks}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              onChange={(event) => setUsesSubtasks(event.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="block text-sm font-bold text-slate-800">
                서브테스크 문제로 채점
              </span>
              <span className="mt-1 block text-sm leading-6 text-slate-500">
                체크하면 일반 실제 채점 테스트 케이스 대신 서브테스크별 테스트 케이스를 전송합니다.
              </span>
            </span>
          </label>
        </Card>

        {usesSubtasks ? (
          <SubtaskEditor
            onAdd={addSubtask}
            onAddTestCase={addSubtaskTestCase}
            onRemove={removeSubtask}
            onRemoveTestCase={removeSubtaskTestCase}
            onUpdate={updateSubtask}
            onUpdateTestCase={updateSubtaskTestCase}
            rows={subtasks}
          />
        ) : (
          <TestCaseEditor
            kind="actual"
            onAdd={addTestCase}
            onRemove={removeTestCase}
            onUpdate={updateTestCase}
            rows={actualCases}
            title="실제 채점 테스트 케이스"
          />
        )}

        <div className="flex justify-end">
          <Button disabled={isSubmitting} type="submit">
            <Save size={16} />
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </div>
      </form>
    </section>
  )
}
