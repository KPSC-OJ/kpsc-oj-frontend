import { useState, type FormEvent, type ReactElement } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import type {
  ContestProblemFormSubtask,
  ContestProblemFormSubtaskTestCase,
  ContestProblemFormTestCase,
  ContestProblemFormValue,
} from '../../types/contest'
import type { ContestProblemTestCaseKindDto } from '../../types/contestApi'

type ContestProblemFormProps = {
  initialValue?: ContestProblemFormValue
  isSubmitting: boolean
  notice?: string
  onSubmit: (formValue: ContestProblemFormValue) => Promise<void>
  requiresReferenceSolution?: boolean
  submitLabel: string
}

type TestCaseEntry = {
  index: number
  testCase: ContestProblemFormTestCase
}

type ParsedPrerequisiteOrders = {
  errorMessage: string | null
  orders: number[]
}

const labelClassName = 'block min-w-0'
const labelTextClassName = 'text-sm font-bold text-slate-700'
const inputClassName =
  'mt-2 w-full min-w-0 rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const textareaClassName =
  'mt-2 w-full min-w-0 resize-y rounded-md border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
const codeTextareaClassName =
  'mt-2 w-full min-w-0 resize-y rounded-md border border-slate-200 px-4 py-3 font-mono text-xs leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function createDefaultSubtask(score = 100): ContestProblemFormSubtask {
  return {
    order: 1,
    prerequisiteSubtaskOrdersText: '',
    score,
    testCases: [{ inputText: '', outputText: '' }],
    title: '',
  }
}

function createDefaultContestProblemFormValue(): ContestProblemFormValue {
  return {
    checkerCode: '',
    constraints: '',
    displayOrder: 1,
    inputDescription: '',
    label: 'A',
    memoryLimitKb: 131072,
    outputDescription: '',
    referenceSolutionCode: '',
    score: 100,
    statement: '',
    subtasks: [createDefaultSubtask()],
    testCases: [
      { caseOrder: 1, inputText: '', kind: 'EXAMPLE', outputText: '' },
      { caseOrder: 2, inputText: '', kind: 'HIDDEN', outputText: '' },
    ],
    timeLimitMillis: 1000,
    title: '',
    usesSubtasks: false,
  }
}

function normalizeOptionalCode(value: string): string {
  return value.trim() ? value : ''
}

function normalizeFormValue(formValue: ContestProblemFormValue): ContestProblemFormValue {
  return {
    checkerCode: normalizeOptionalCode(formValue.checkerCode),
    constraints: formValue.constraints.trim(),
    displayOrder: formValue.displayOrder,
    inputDescription: formValue.inputDescription.trim(),
    label: formValue.label.trim(),
    memoryLimitKb: formValue.memoryLimitKb,
    outputDescription: formValue.outputDescription.trim(),
    referenceSolutionCode: normalizeOptionalCode(formValue.referenceSolutionCode),
    score: formValue.score,
    statement: formValue.statement.trim(),
    subtasks: formValue.subtasks.map((subtask) => ({
      order: subtask.order,
      prerequisiteSubtaskOrdersText: subtask.prerequisiteSubtaskOrdersText.trim(),
      score: subtask.score,
      testCases: subtask.testCases.map((testCase) => ({
        inputText: testCase.inputText,
        outputText: testCase.outputText,
      })),
      title: subtask.title.trim(),
    })),
    testCases: formValue.testCases.map((testCase) => ({
      caseOrder: testCase.caseOrder,
      inputText: testCase.inputText,
      kind: testCase.kind,
      outputText: testCase.outputText,
    })),
    timeLimitMillis: formValue.timeLimitMillis,
    title: formValue.title.trim(),
    usesSubtasks: formValue.usesSubtasks,
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
  subtasks: ContestProblemFormSubtask[],
): string | null {
  const availableOrders = new Set(subtasks.map((subtask) => subtask.order))
  const prerequisiteOrdersByOrder = new Map<number, number[]>()

  for (const subtask of subtasks) {
    const parsedPrerequisites = parsePrerequisiteSubtaskOrdersText(
      subtask.prerequisiteSubtaskOrdersText,
    )

    if (parsedPrerequisites.errorMessage) {
      return `서브테스크 ${subtask.order}: ${parsedPrerequisites.errorMessage}`
    }

    if (parsedPrerequisites.orders.includes(subtask.order)) {
      return `서브테스크 ${subtask.order}는 자기 자신을 선행 서브테스크로 지정할 수 없습니다.`
    }

    const missingOrder = parsedPrerequisites.orders.find(
      (prerequisiteOrder) => !availableOrders.has(prerequisiteOrder),
    )

    if (missingOrder) {
      return `서브테스크 ${subtask.order}의 선행 서브테스크 ${missingOrder}번이 존재하지 않습니다.`
    }

    prerequisiteOrdersByOrder.set(subtask.order, parsedPrerequisites.orders)
  }

  if (hasCyclicSubtaskPrerequisites(prerequisiteOrdersByOrder)) {
    return '서브테스크 선행 관계에 순환이 있습니다.'
  }

  return null
}

function validateSubtasks(subtasks: ContestProblemFormSubtask[]): string | null {
  if (subtasks.length === 0) {
    return '서브테스크를 최소 1개 입력해야 합니다.'
  }

  const orders = new Set<number>()
  const scoreSum = subtasks.reduce((sum, subtask) => sum + subtask.score, 0)

  for (const subtask of subtasks) {
    if (subtask.order <= 0 || !Number.isInteger(subtask.order)) {
      return '서브테스크 order는 양의 정수여야 합니다.'
    }

    if (orders.has(subtask.order)) {
      return '서브테스크 order는 중복될 수 없습니다.'
    }

    orders.add(subtask.order)

    if (!subtask.title) {
      return `서브테스크 ${subtask.order} 제목을 입력해야 합니다.`
    }

    if (subtask.title.length > 64) {
      return `서브테스크 ${subtask.order} 제목은 64자 이하로 입력해야 합니다.`
    }

    if (subtask.score <= 0 || !Number.isInteger(subtask.score)) {
      return `서브테스크 ${subtask.order} 배점은 양의 정수여야 합니다.`
    }

    if (subtask.testCases.length === 0) {
      return `서브테스크 ${subtask.order}에 채점 테스트 케이스가 필요합니다.`
    }
  }

  if (scoreSum !== 100) {
    return '서브테스크 배점 합은 정확히 100이어야 합니다.'
  }

  return getSubtaskPrerequisiteValidationMessage(subtasks)
}

function validateFormValue(
  formValue: ContestProblemFormValue,
  requiresReferenceSolution: boolean,
): string | null {
  if (!formValue.label || !formValue.title) {
    return '문제 label과 제목을 입력해야 합니다.'
  }

  if (!formValue.statement || !formValue.inputDescription || !formValue.outputDescription) {
    return '본문, 입력 설명, 출력 설명을 입력해야 합니다.'
  }

  if (!formValue.constraints) {
    return '제약을 입력해야 합니다.'
  }

  if (
    formValue.timeLimitMillis <= 0 ||
    formValue.memoryLimitKb <= 0 ||
    formValue.score <= 0 ||
    formValue.displayOrder <= 0
  ) {
    return '시간 제한, 메모리 제한, 점수, 표시 순서는 양수여야 합니다.'
  }

  if (requiresReferenceSolution && !formValue.referenceSolutionCode.trim()) {
    return '예시 정답 C++17 코드를 입력해야 합니다.'
  }

  const activeTestCases = formValue.usesSubtasks
    ? formValue.testCases.filter((testCase) => testCase.kind === 'EXAMPLE')
    : formValue.testCases

  if (!activeTestCases.some((testCase) => testCase.kind === 'EXAMPLE')) {
    return 'EXAMPLE 테스트케이스가 최소 1개 필요합니다.'
  }

  if (
    !formValue.usesSubtasks &&
    !activeTestCases.some((testCase) => testCase.kind === 'HIDDEN')
  ) {
    return 'HIDDEN 테스트케이스가 최소 1개 필요합니다.'
  }

  const caseOrders = new Set<number>()

  for (const testCase of activeTestCases) {
    if (testCase.caseOrder <= 0 || !Number.isInteger(testCase.caseOrder)) {
      return '테스트케이스 순서는 양의 정수여야 합니다.'
    }

    if (caseOrders.has(testCase.caseOrder)) {
      return '테스트케이스 순서는 중복될 수 없습니다.'
    }

    caseOrders.add(testCase.caseOrder)
  }

  if (formValue.usesSubtasks) {
    return validateSubtasks(formValue.subtasks)
  }

  return null
}

function getNextCaseOrder(testCases: ContestProblemFormTestCase[]): number {
  return Math.max(0, ...testCases.map((testCase) => testCase.caseOrder)) + 1
}

function getNextSubtaskOrder(subtasks: ContestProblemFormSubtask[]): number {
  return Math.max(0, ...subtasks.map((subtask) => subtask.order)) + 1
}

export function ContestProblemForm({
  initialValue,
  isSubmitting,
  notice,
  onSubmit,
  requiresReferenceSolution = false,
  submitLabel,
}: ContestProblemFormProps): ReactElement {
  const [formValue, setFormValue] = useState<ContestProblemFormValue>(
    () => initialValue ?? createDefaultContestProblemFormValue(),
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function updateTextField(
    fieldName: keyof Pick<
      ContestProblemFormValue,
      | 'checkerCode'
      | 'constraints'
      | 'inputDescription'
      | 'label'
      | 'outputDescription'
      | 'referenceSolutionCode'
      | 'statement'
      | 'title'
    >,
    value: string,
  ): void {
    setFormValue((currentValue) => ({
      ...currentValue,
      [fieldName]: value,
    }))
  }

  function updateNumberField(
    fieldName: keyof Pick<
      ContestProblemFormValue,
      'displayOrder' | 'memoryLimitKb' | 'score' | 'timeLimitMillis'
    >,
    value: string,
  ): void {
    setFormValue((currentValue) => ({
      ...currentValue,
      [fieldName]: Number(value),
    }))
  }

  function updateTestCase(index: number, patch: Partial<ContestProblemFormTestCase>): void {
    setFormValue((currentValue) => ({
      ...currentValue,
      testCases: currentValue.testCases.map((testCase, testCaseIndex) =>
        testCaseIndex === index ? { ...testCase, ...patch } : testCase,
      ),
    }))
  }

  function addTestCase(kind: ContestProblemTestCaseKindDto): void {
    setFormValue((currentValue) => ({
      ...currentValue,
      testCases: [
        ...currentValue.testCases,
        {
          caseOrder: getNextCaseOrder(currentValue.testCases),
          inputText: '',
          kind,
          outputText: '',
        },
      ],
    }))
  }

  function removeTestCase(index: number): void {
    setFormValue((currentValue) => ({
      ...currentValue,
      testCases: currentValue.testCases.filter((_, testCaseIndex) => testCaseIndex !== index),
    }))
  }

  function updateSubtask(index: number, patch: Partial<ContestProblemFormSubtask>): void {
    setFormValue((currentValue) => ({
      ...currentValue,
      subtasks: currentValue.subtasks.map((subtask, subtaskIndex) =>
        subtaskIndex === index ? { ...subtask, ...patch } : subtask,
      ),
    }))
  }

  function addSubtask(): void {
    setFormValue((currentValue) => ({
      ...currentValue,
      subtasks: [
        ...currentValue.subtasks,
        {
          ...createDefaultSubtask(1),
          order: getNextSubtaskOrder(currentValue.subtasks),
        },
      ],
    }))
  }

  function removeSubtask(index: number): void {
    setFormValue((currentValue) => ({
      ...currentValue,
      subtasks:
        currentValue.subtasks.length === 1
          ? currentValue.subtasks
          : currentValue.subtasks.filter((_, subtaskIndex) => subtaskIndex !== index),
    }))
  }

  function addSubtaskTestCase(subtaskIndex: number): void {
    setFormValue((currentValue) => ({
      ...currentValue,
      subtasks: currentValue.subtasks.map((subtask, index) =>
        index === subtaskIndex
          ? {
              ...subtask,
              testCases: [...subtask.testCases, { inputText: '', outputText: '' }],
            }
          : subtask,
      ),
    }))
  }

  function updateSubtaskTestCase(
    subtaskIndex: number,
    testCaseIndex: number,
    patch: Partial<ContestProblemFormSubtaskTestCase>,
  ): void {
    setFormValue((currentValue) => ({
      ...currentValue,
      subtasks: currentValue.subtasks.map((subtask, index) =>
        index === subtaskIndex
          ? {
              ...subtask,
              testCases: subtask.testCases.map((testCase, currentTestCaseIndex) =>
                currentTestCaseIndex === testCaseIndex ? { ...testCase, ...patch } : testCase,
              ),
            }
          : subtask,
      ),
    }))
  }

  function removeSubtaskTestCase(subtaskIndex: number, testCaseIndex: number): void {
    setFormValue((currentValue) => ({
      ...currentValue,
      subtasks: currentValue.subtasks.map((subtask, index) =>
        index === subtaskIndex
          ? {
              ...subtask,
              testCases:
                subtask.testCases.length === 1
                  ? subtask.testCases
                  : subtask.testCases.filter(
                      (_, currentTestCaseIndex) => currentTestCaseIndex !== testCaseIndex,
                    ),
            }
          : subtask,
      ),
    }))
  }

  function getTestCaseEntries(kind: ContestProblemTestCaseKindDto): TestCaseEntry[] {
    return formValue.testCases
      .map((testCase, index) => ({ index, testCase }))
      .filter((entry) => entry.testCase.kind === kind)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    const normalizedValue = normalizeFormValue(formValue)
    const validationErrorMessage = validateFormValue(normalizedValue, requiresReferenceSolution)

    if (validationErrorMessage) {
      setErrorMessage(validationErrorMessage)

      return
    }

    setErrorMessage(null)
    await onSubmit(normalizedValue)
  }

  function renderTestCaseSection(
    kind: ContestProblemTestCaseKindDto,
    title: string,
    description: string,
    addButtonLabel: string,
  ): ReactElement {
    const entries = getTestCaseEntries(kind)

    return (
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-black text-slate-950">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
          <Button onClick={() => addTestCase(kind)} size="sm" type="button" variant="secondary">
            <Plus size={16} />
            {addButtonLabel}
          </Button>
        </div>

        <div className="mt-4 grid min-w-0 gap-4">
          {entries.map(({ index, testCase }) => (
            <section
              className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-4"
              key={`${testCase.kind}-${index}`}
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <label className="block min-w-0 sm:w-40">
                  <span className={labelTextClassName}>순서</span>
                  <input
                    className={inputClassName}
                    min={1}
                    onChange={(event) =>
                      updateTestCase(index, { caseOrder: Number(event.target.value) })
                    }
                    type="number"
                    value={testCase.caseOrder}
                  />
                </label>

                <Button
                  aria-label="테스트케이스 삭제"
                  className="w-full sm:w-auto"
                  onClick={() => removeTestCase(index)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 size={16} />
                  삭제
                </Button>
              </div>

              <div className="grid min-w-0 gap-3 md:grid-cols-2">
                <label className={labelClassName}>
                  <span className={labelTextClassName}>입력</span>
                  <textarea
                    className={`${codeTextareaClassName} min-h-28`}
                    onChange={(event) => updateTestCase(index, { inputText: event.target.value })}
                    value={testCase.inputText}
                  />
                </label>

                <label className={labelClassName}>
                  <span className={labelTextClassName}>출력</span>
                  <textarea
                    className={`${codeTextareaClassName} min-h-28`}
                    onChange={(event) => updateTestCase(index, { outputText: event.target.value })}
                    value={testCase.outputText}
                  />
                </label>
              </div>
            </section>
          ))}
        </div>
      </Card>
    )
  }

  function renderSubtaskSection(): ReactElement {
    const scoreSum = formValue.subtasks.reduce((sum, subtask) => sum + subtask.score, 0)

    return (
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-lg font-black text-slate-950">서브테스크</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              서브테스크별 배점, 선행 order, 비공개 채점 테스트 케이스를 입력합니다.
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
          <Button onClick={addSubtask} size="sm" type="button" variant="secondary">
            <Plus size={16} />
            서브테스크 추가
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          {formValue.subtasks.map((subtask, subtaskIndex) => (
            <section className="rounded-md border border-slate-200 bg-slate-50 p-4" key={subtaskIndex}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-slate-700">
                  서브테스크 {subtask.order}
                </p>
                <Button
                  disabled={formValue.subtasks.length === 1}
                  onClick={() => removeSubtask(subtaskIndex)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 size={16} />
                  삭제
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-[120px_minmax(0,1fr)_140px]">
                <label className={labelClassName}>
                  <span className={labelTextClassName}>Order</span>
                  <input
                    className={inputClassName}
                    min={1}
                    onChange={(event) =>
                      updateSubtask(subtaskIndex, { order: Number(event.target.value) })
                    }
                    type="number"
                    value={subtask.order}
                  />
                </label>

                <label className={labelClassName}>
                  <span className={labelTextClassName}>제목</span>
                  <input
                    className={inputClassName}
                    maxLength={64}
                    onChange={(event) =>
                      updateSubtask(subtaskIndex, { title: event.target.value })
                    }
                    placeholder="예: 작은 입력"
                    value={subtask.title}
                  />
                </label>

                <label className={labelClassName}>
                  <span className={labelTextClassName}>배점</span>
                  <input
                    className={inputClassName}
                    min={1}
                    onChange={(event) =>
                      updateSubtask(subtaskIndex, { score: Number(event.target.value) })
                    }
                    type="number"
                    value={subtask.score}
                  />
                </label>

                <label className="block min-w-0 md:col-span-3">
                  <span className={labelTextClassName}>선행 서브테스크 order</span>
                  <input
                    className={inputClassName}
                    onChange={(event) =>
                      updateSubtask(subtaskIndex, {
                        prerequisiteSubtaskOrdersText: event.target.value,
                      })
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
                  <h4 className="text-sm font-black text-slate-800">
                    서브테스크 채점 테스트 케이스
                  </h4>
                  <Button
                    onClick={() => addSubtaskTestCase(subtaskIndex)}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    <Plus size={16} />
                    케이스 추가
                  </Button>
                </div>

                {subtask.testCases.map((testCase, testCaseIndex) => (
                  <div
                    className="rounded-md border border-slate-200 bg-white p-4"
                    key={testCaseIndex}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-700">
                        케이스 {testCaseIndex + 1}
                      </p>
                      <Button
                        disabled={subtask.testCases.length === 1}
                        onClick={() => removeSubtaskTestCase(subtaskIndex, testCaseIndex)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 size={16} />
                        삭제
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className={labelClassName}>
                        <span className={labelTextClassName}>입력</span>
                        <textarea
                          className={`${codeTextareaClassName} min-h-28 bg-white`}
                          onChange={(event) =>
                            updateSubtaskTestCase(subtaskIndex, testCaseIndex, {
                              inputText: event.target.value,
                            })
                          }
                          value={testCase.inputText}
                        />
                      </label>

                      <label className={labelClassName}>
                        <span className={labelTextClassName}>출력</span>
                        <textarea
                          className={`${codeTextareaClassName} min-h-28 bg-white`}
                          onChange={(event) =>
                            updateSubtaskTestCase(subtaskIndex, testCaseIndex, {
                              outputText: event.target.value,
                            })
                          }
                          value={testCase.outputText}
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

  return (
    <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
      {notice ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {notice}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <Card>
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <label className={labelClassName}>
            <span className={labelTextClassName}>문제 Label</span>
            <input
              className={inputClassName}
              maxLength={16}
              onChange={(event) => updateTextField('label', event.target.value)}
              placeholder="A"
              required
              value={formValue.label}
            />
            <span className="mt-1 block text-xs text-slate-500">
              대회 문제 목록과 스코어보드에 표시되는 번호 또는 문자입니다.
            </span>
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>문제 제목</span>
            <input
              className={inputClassName}
              onChange={(event) => updateTextField('title', event.target.value)}
              placeholder="대회 문제 제목"
              required
              value={formValue.title}
            />
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>점수</span>
            <input
              className={inputClassName}
              min={1}
              onChange={(event) => updateNumberField('score', event.target.value)}
              required
              type="number"
              value={formValue.score}
            />
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>표시 순서</span>
            <input
              className={inputClassName}
              min={1}
              onChange={(event) => updateNumberField('displayOrder', event.target.value)}
              required
              type="number"
              value={formValue.displayOrder}
            />
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>시간 제한</span>
            <input
              className={inputClassName}
              min={1}
              onChange={(event) => updateNumberField('timeLimitMillis', event.target.value)}
              required
              type="number"
              value={formValue.timeLimitMillis}
            />
            <span className="mt-1 block text-xs text-slate-500">milliseconds 단위</span>
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>메모리 제한</span>
            <input
              className={inputClassName}
              min={1}
              onChange={(event) => updateNumberField('memoryLimitKb', event.target.value)}
              required
              type="number"
              value={formValue.memoryLimitKb}
            />
            <span className="mt-1 block text-xs text-slate-500">KB 단위</span>
          </label>

          <label className="block min-w-0 md:col-span-2">
            <span className={labelTextClassName}>문제 본문</span>
            <textarea
              className={`${textareaClassName} min-h-72`}
              onChange={(event) => updateTextField('statement', event.target.value)}
              placeholder="Markdown으로 대회 문제 설명을 작성하세요."
              required
              value={formValue.statement}
            />
          </label>
        </div>
      </Card>

      <Card>
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <label className={labelClassName}>
            <span className={labelTextClassName}>입력 설명</span>
            <textarea
              className={`${textareaClassName} min-h-36`}
              onChange={(event) => updateTextField('inputDescription', event.target.value)}
              required
              value={formValue.inputDescription}
            />
          </label>

          <label className={labelClassName}>
            <span className={labelTextClassName}>출력 설명</span>
            <textarea
              className={`${textareaClassName} min-h-36`}
              onChange={(event) => updateTextField('outputDescription', event.target.value)}
              required
              value={formValue.outputDescription}
            />
          </label>

          <label className="block min-w-0 md:col-span-2">
            <span className={labelTextClassName}>제약</span>
            <textarea
              className={`${textareaClassName} min-h-32`}
              onChange={(event) => updateTextField('constraints', event.target.value)}
              required
              value={formValue.constraints}
            />
          </label>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4">
          {requiresReferenceSolution ? (
            <label className={labelClassName}>
              <span className={labelTextClassName}>예시 정답 C++17 코드</span>
              <textarea
                className={`${codeTextareaClassName} min-h-64`}
                onChange={(event) =>
                  updateTextField('referenceSolutionCode', event.target.value)
                }
                placeholder="실제 채점 테스트 케이스를 모두 통과하는 C++17 전체 소스 코드를 입력하세요."
                required
                value={formValue.referenceSolutionCode}
              />
              <span className="mt-1 block text-xs text-slate-500">
                생성 요청에만 전송되며 저장되지 않습니다. 백엔드가 HIDDEN 테스트 케이스로 사전 채점합니다.
              </span>
            </label>
          ) : null}

          <label className={labelClassName}>
            <span className={labelTextClassName}>선택 checker C++17 코드</span>
            <textarea
              className={`${codeTextareaClassName} min-h-48`}
              onChange={(event) => updateTextField('checkerCode', event.target.value)}
              placeholder="공백이면 judge 기본 출력 비교를 사용합니다."
              value={formValue.checkerCode}
            />
            <span className="mt-1 block text-xs text-slate-500">
              testlib 기반 checker가 필요할 때만 전체 C++17 소스 코드를 입력합니다.
            </span>
          </label>
        </div>
      </Card>

      {renderTestCaseSection(
        'EXAMPLE',
        '공개 예제 테스트 케이스',
        '문제 상세에 공개되는 입력과 출력 예제입니다.',
        '예제 추가',
      )}

      <Card>
        <label className="flex items-start gap-3">
          <input
            checked={formValue.usesSubtasks}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            onChange={(event) =>
              setFormValue((currentValue) => ({
                ...currentValue,
                usesSubtasks: event.target.checked,
              }))
            }
            type="checkbox"
          />
          <span>
            <span className="block text-sm font-bold text-slate-800">
              서브테스크 문제로 채점
            </span>
            <span className="mt-1 block text-sm leading-6 text-slate-500">
              체크하면 일반 HIDDEN 테스트 케이스 대신 서브테스크별 테스트 케이스를 전송합니다.
            </span>
          </span>
        </label>
      </Card>

      {formValue.usesSubtasks
        ? renderSubtaskSection()
        : renderTestCaseSection(
            'HIDDEN',
            '비공개 채점 테스트 케이스',
            '대회 제출 채점에 사용하는 숨김 테스트 케이스입니다.',
            '채점 케이스 추가',
          )}

      <div className="flex justify-end">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? '저장 중' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
