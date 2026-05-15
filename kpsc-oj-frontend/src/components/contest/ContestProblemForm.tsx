import { useState, type FormEvent, type ReactElement } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../common/Button'
import type { ContestProblemFormValue, ContestProblemFormTestCase } from '../../types/contest'
import type { ContestProblemTestCaseKindDto } from '../../types/contestApi'

type ContestProblemFormProps = {
  initialValue?: ContestProblemFormValue
  isSubmitting: boolean
  notice?: string
  onSubmit: (formValue: ContestProblemFormValue) => Promise<void>
  submitLabel: string
}

function createDefaultContestProblemFormValue(): ContestProblemFormValue {
  return {
    constraints: '',
    displayOrder: 1,
    inputDescription: '',
    label: 'A',
    memoryLimitKb: 131072,
    outputDescription: '',
    score: 100,
    statement: '',
    testCases: [
      { caseOrder: 1, inputText: '', kind: 'EXAMPLE', outputText: '' },
      { caseOrder: 2, inputText: '', kind: 'HIDDEN', outputText: '' },
    ],
    timeLimitMillis: 1000,
    title: '',
  }
}

function normalizeFormValue(formValue: ContestProblemFormValue): ContestProblemFormValue {
  return {
    constraints: formValue.constraints.trim(),
    displayOrder: formValue.displayOrder,
    inputDescription: formValue.inputDescription.trim(),
    label: formValue.label.trim(),
    memoryLimitKb: formValue.memoryLimitKb,
    outputDescription: formValue.outputDescription.trim(),
    score: formValue.score,
    statement: formValue.statement.trim(),
    testCases: formValue.testCases.map((testCase) => ({
      caseOrder: testCase.caseOrder,
      inputText: testCase.inputText,
      kind: testCase.kind,
      outputText: testCase.outputText,
    })),
    timeLimitMillis: formValue.timeLimitMillis,
    title: formValue.title.trim(),
  }
}

function validateFormValue(formValue: ContestProblemFormValue): string | null {
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

  if (!formValue.testCases.some((testCase) => testCase.kind === 'HIDDEN')) {
    return 'HIDDEN 테스트케이스가 최소 1개 필요합니다.'
  }

  const caseOrders = new Set<number>()

  for (const testCase of formValue.testCases) {
    if (testCase.caseOrder <= 0) {
      return '테스트케이스 순서는 양수여야 합니다.'
    }

    if (caseOrders.has(testCase.caseOrder)) {
      return '테스트케이스 순서는 중복될 수 없습니다.'
    }

    caseOrders.add(testCase.caseOrder)
  }

  return null
}

function getNextCaseOrder(testCases: ContestProblemFormTestCase[]): number {
  return Math.max(0, ...testCases.map((testCase) => testCase.caseOrder)) + 1
}

export function ContestProblemForm({
  initialValue,
  isSubmitting,
  notice,
  onSubmit,
  submitLabel,
}: ContestProblemFormProps): ReactElement {
  const [formValue, setFormValue] = useState<ContestProblemFormValue>(
    () => initialValue ?? createDefaultContestProblemFormValue(),
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function updateTextField(
    fieldName: keyof Pick<
      ContestProblemFormValue,
      'constraints' | 'inputDescription' | 'label' | 'outputDescription' | 'statement' | 'title'
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

  function updateTestCase(
    index: number,
    patch: Partial<ContestProblemFormTestCase>,
  ): void {
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    const normalizedValue = normalizeFormValue(formValue)
    const validationErrorMessage = validateFormValue(normalizedValue)

    if (validationErrorMessage) {
      setErrorMessage(validationErrorMessage)

      return
    }

    setErrorMessage(null)
    await onSubmit(normalizedValue)
  }

  return (
    <form className="grid gap-5" onSubmit={(event) => void handleSubmit(event)}>
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

      <div className="grid gap-4 md:grid-cols-[120px_1fr_120px_120px]">
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Label
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            onChange={(event) => updateTextField('label', event.target.value)}
            value={formValue.label}
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Title
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            onChange={(event) => updateTextField('title', event.target.value)}
            value={formValue.title}
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Score
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            min={1}
            onChange={(event) => updateNumberField('score', event.target.value)}
            type="number"
            value={formValue.score}
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Order
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            min={1}
            onChange={(event) => updateNumberField('displayOrder', event.target.value)}
            type="number"
            value={formValue.displayOrder}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Time limit millis
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            min={1}
            onChange={(event) => updateNumberField('timeLimitMillis', event.target.value)}
            type="number"
            value={formValue.timeLimitMillis}
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Memory limit KB
          <input
            className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            min={1}
            onChange={(event) => updateNumberField('memoryLimitKb', event.target.value)}
            type="number"
            value={formValue.memoryLimitKb}
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm font-bold text-slate-700">
        Statement
        <textarea
          className="min-h-40 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          onChange={(event) => updateTextField('statement', event.target.value)}
          value={formValue.statement}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Input description
          <textarea
            className="min-h-28 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            onChange={(event) => updateTextField('inputDescription', event.target.value)}
            value={formValue.inputDescription}
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          Output description
          <textarea
            className="min-h-28 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            onChange={(event) => updateTextField('outputDescription', event.target.value)}
            value={formValue.outputDescription}
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm font-bold text-slate-700">
        Constraints
        <textarea
          className="min-h-24 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          onChange={(event) => updateTextField('constraints', event.target.value)}
          value={formValue.constraints}
        />
      </label>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-black text-slate-950">Test cases</h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => addTestCase('EXAMPLE')} size="sm" type="button" variant="secondary">
              <Plus size={16} />
              Example
            </Button>
            <Button onClick={() => addTestCase('HIDDEN')} size="sm" type="button" variant="secondary">
              <Plus size={16} />
              Hidden
            </Button>
          </div>
        </div>

        <div className="grid gap-4 p-4">
          {formValue.testCases.map((testCase, index) => (
            <div className="rounded-md border border-slate-200 p-4" key={`${testCase.kind}-${index}`}>
              <div className="mb-3 grid gap-3 md:grid-cols-[120px_160px_1fr_auto]">
                <label className="grid gap-1 text-sm font-bold text-slate-700">
                  Order
                  <input
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    min={1}
                    onChange={(event) =>
                      updateTestCase(index, { caseOrder: Number(event.target.value) })
                    }
                    type="number"
                    value={testCase.caseOrder}
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold text-slate-700">
                  Kind
                  <select
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    onChange={(event) =>
                      updateTestCase(index, {
                        kind: event.target.value as ContestProblemTestCaseKindDto,
                      })
                    }
                    value={testCase.kind}
                  >
                    <option value="EXAMPLE">EXAMPLE</option>
                    <option value="HIDDEN">HIDDEN</option>
                  </select>
                </label>
                <div />
                <Button
                  aria-label="테스트케이스 삭제"
                  onClick={() => removeTestCase(index)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-sm font-bold text-slate-700">
                  Input
                  <textarea
                    className="min-h-28 rounded-md border border-slate-200 px-3 py-2 font-mono text-sm outline-none focus:border-blue-500"
                    onChange={(event) => updateTestCase(index, { inputText: event.target.value })}
                    value={testCase.inputText}
                  />
                </label>
                <label className="grid gap-1 text-sm font-bold text-slate-700">
                  Output
                  <textarea
                    className="min-h-28 rounded-md border border-slate-200 px-3 py-2 font-mono text-sm outline-none focus:border-blue-500"
                    onChange={(event) => updateTestCase(index, { outputText: event.target.value })}
                    value={testCase.outputText}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? '저장 중' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
