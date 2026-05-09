import { useState, type ChangeEvent, type FormEvent, type ReactElement } from 'react'
import { CheckCircle2, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { useCreateProblem } from '../hooks/useCreateProblem'
import type { AuthApiError } from '../types/auth'
import type {
  CreateProblemRequestDto,
  CreateProblemResponseDto,
} from '../types/problemApi'

type ProblemFormState = {
  checkerCode: string
  memoryLimitMegabytes: string
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

const initialProblemFormState: ProblemFormState = {
  checkerCode: '',
  memoryLimitMegabytes: '128',
  statementMarkdown: '',
  tag: '',
  timeLimitSeconds: '1',
  title: '',
}

let testCaseSequence = 0

function createTestCaseRow(kind: TestCaseKind): TestCaseFormRow {
  testCaseSequence += 1

  return {
    id: `${kind}-${testCaseSequence}`,
    input: '',
    output: '',
  }
}

function parsePositiveInteger(value: string): number | null {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null
  }

  return parsedValue
}

function getErrorMessage(error: unknown): string {
  const apiError = error as Partial<AuthApiError>

  if (apiError.status === 403 || apiError.code === 'FORBIDDEN_OPERATION') {
    return '문제 생성 권한이 없습니다.'
  }

  if (apiError.status === 401 || apiError.code === 'AUTHENTICATION_FAILED') {
    return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  }

  if (typeof apiError.message === 'string') {
    return apiError.message
  }

  return '문제를 생성하지 못했습니다.'
}

function renderValidationMessage(
  formState: ProblemFormState,
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

export function AdminProblemNewPage(): ReactElement {
  const { createProblemWithCurrentSession } = useCreateProblem()
  const [formState, setFormState] = useState<ProblemFormState>(initialProblemFormState)
  const [exampleCases, setExampleCases] = useState<TestCaseFormRow[]>([
    createTestCaseRow('example'),
  ])
  const [actualCases, setActualCases] = useState<TestCaseFormRow[]>([
    createTestCaseRow('actual'),
  ])
  const [createdProblem, setCreatedProblem] = useState<CreateProblemResponseDto | null>(null)
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

  function resetForm(): void {
    setFormState(initialProblemFormState)
    setExampleCases([createTestCaseRow('example')])
    setActualCases([createTestCaseRow('actual')])
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setCreatedProblem(null)
    setErrorMessage(null)

    const timeLimitSeconds = parsePositiveInteger(formState.timeLimitSeconds)
    const memoryLimitMegabytes = parsePositiveInteger(formState.memoryLimitMegabytes)
    const validationMessage = renderValidationMessage(
      formState,
      timeLimitSeconds,
      memoryLimitMegabytes,
    )

    if (validationMessage || !timeLimitSeconds || !memoryLimitMegabytes) {
      setErrorMessage(validationMessage ?? '제한 조건을 확인해주세요.')

      return
    }

    const checkerCode = formState.checkerCode.trim() ? formState.checkerCode : undefined
    const requestDto: CreateProblemRequestDto = {
      actualTestCaseInputs: actualCases.map((testCase) => testCase.input),
      actualTestCaseOutputs: actualCases.map((testCase) => testCase.output),
      checkerCode,
      exampleInputs: exampleCases.map((testCase) => testCase.input),
      exampleOutputs: exampleCases.map((testCase) => testCase.output),
      memoryLimitMegabytes,
      statementMarkdown: formState.statementMarkdown,
      tag: formState.tag.trim(),
      timeLimitSeconds,
      title: formState.title.trim(),
    }

    setIsSubmitting(true)

    try {
      const nextCreatedProblem = await createProblemWithCurrentSession(requestDto)

      setCreatedProblem(nextCreatedProblem)
      resetForm()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold text-blue-600">Admin</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">문제 생성</h1>
          <p className="mt-1 text-sm text-slate-500">
            문제 본문, 제한 조건, 선택 checker, 예제와 실제 채점 테스트 케이스를
            등록합니다.
          </p>
        </div>
      </div>

      {createdProblem ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-bold">문제가 생성되었습니다.</p>
              <p className="mt-1">
                {createdProblem.title} · 예제 {createdProblem.exampleTestCaseCount}개 · 실제
                테스트 {createdProblem.actualTestCaseCount}개
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

            <label className="block md:col-span-2">
              <span className="text-sm font-bold text-slate-700">
                채점용 checker C++ 코드
              </span>
              <textarea
                className="mt-2 min-h-56 w-full resize-y rounded-md border border-slate-200 px-4 py-3 font-mono text-xs leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                onChange={updateField('checkerCode')}
                placeholder="기본 출력 비교를 사용할 경우 비워둡니다."
                value={formState.checkerCode}
              />
              <span className="mt-1 block text-xs text-slate-500">
                C++17 checker 코드가 있는 경우에만 등록합니다.
              </span>
            </label>
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

        <TestCaseEditor
          kind="actual"
          onAdd={addTestCase}
          onRemove={removeTestCase}
          onUpdate={updateTestCase}
          rows={actualCases}
          title="실제 채점 테스트 케이스"
        />

        <div className="flex justify-end">
          <Button disabled={isSubmitting} type="submit">
            <Save size={16} />
            {isSubmitting ? '생성 중' : '문제 생성'}
          </Button>
        </div>
      </form>
    </section>
  )
}
