import { useState } from 'react'
import { RotateCcw, Send } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { CodeEditor, type CodeEditorLanguage } from '../components/problem/CodeEditor'
import { SubmissionStatusBadge } from '../components/submission/SubmissionStatusBadge'
import { useCreateSubmission } from '../hooks/useCreateSubmission'
import { useMySubmissions } from '../hooks/useMySubmissions'
import { useProblemDetail } from '../hooks/useProblemDetail'
import { useSubmissionDetail } from '../hooks/useSubmissionDetail'
import type { AuthApiError } from '../types/auth'
import type { SubmissionDetail, SubmissionTestCaseResult } from '../types/submission'
import type {
  CreateSubmissionResponseDto,
  SubmissionLanguageDto,
} from '../types/submissionApi'

const defaultSourceCode = `#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << '\\n';
    return 0;
}`

const submissionLanguageOptions: Array<{
  editorLanguage: CodeEditorLanguage
  label: string
  value: SubmissionLanguageDto
}> = [
  { editorLanguage: 'cpp', label: 'C++17', value: 'cpp17' },
  { editorLanguage: 'python', label: 'Python 3', value: 'python3' },
]

function parseProblemNumber(value: string | undefined): number | null {
  const parsedValue = Number(value)

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null
}

function getEditorLanguage(language: SubmissionLanguageDto): CodeEditorLanguage {
  return (
    submissionLanguageOptions.find((languageOption) => languageOption.value === language)
      ?.editorLanguage ?? 'cpp'
  )
}

function getLanguageLabel(language: SubmissionLanguageDto): string {
  return (
    submissionLanguageOptions.find((languageOption) => languageOption.value === language)
      ?.label ?? 'C++17'
  )
}

function getErrorMessage(error: unknown): string {
  const apiError = error as Partial<AuthApiError>

  if (apiError.status === 404 || apiError.code === 'PROBLEM_NOT_FOUND') {
    return '제출할 문제를 찾을 수 없습니다.'
  }

  if (apiError.status === 401 || apiError.code === 'AUTHENTICATION_FAILED') {
    return '로그인이 만료되었습니다. 다시 로그인해주세요.'
  }

  if (apiError.code === 'UNSUPPORTED_LANGUAGE') {
    return '지원하지 않는 언어입니다.'
  }

  if (typeof apiError.message === 'string') {
    return apiError.message
  }

  return '제출을 생성하지 못했습니다.'
}

function formatScorePercentage(scorePercentage: number | null): string {
  return scorePercentage === null ? '점수 산정 전' : `${scorePercentage}%`
}

function getSubmissionDiagnosticMessage(submissionDetail: SubmissionDetail): string | null {
  return submissionDetail.compileErrorMessage ?? submissionDetail.runtimeErrorMessage
}

function formatTestCaseResource(testCaseResult: SubmissionTestCaseResult): string {
  const resourceParts = []

  if (testCaseResult.executionTimeMillis !== null) {
    resourceParts.push(`${testCaseResult.executionTimeMillis}ms`)
  }

  if (testCaseResult.memoryUsageKilobytes !== null) {
    resourceParts.push(`${testCaseResult.memoryUsageKilobytes}KB`)
  }

  return resourceParts.length > 0 ? resourceParts.join(' · ') : '리소스 기록 없음'
}

export function SubmitPage() {
  const { id } = useParams()
  const problemNumber = parseProblemNumber(id)
  const { errorMessage: problemErrorMessage, isLoading, problem } = useProblemDetail(problemNumber)
  const { submissionPage } = useMySubmissions(1, problemNumber ?? undefined)
  const { createSubmissionWithCurrentSession } = useCreateSubmission()
  const [selectedLanguage, setSelectedLanguage] = useState<SubmissionLanguageDto>('cpp17')
  const [sourceCode, setSourceCode] = useState(defaultSourceCode)
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null)
  const [createdSubmission, setCreatedSubmission] =
    useState<CreateSubmissionResponseDto | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    errorMessage: submissionDetailErrorMessage,
    isLoading: isSubmissionDetailLoading,
    isPolling,
    submissionDetail,
  } = useSubmissionDetail(createdSubmission?.id ?? null)

  const recentSubmission = submissionPage?.submissions[0] ?? null
  const selectedLanguageLabel = getLanguageLabel(selectedLanguage)
  const visibleSubmissionStatus =
    submissionDetail?.status ?? createdSubmission?.status ?? recentSubmission?.status
  const visibleSubmittedAt = submissionDetail?.submittedAt ?? createdSubmission?.submittedAt
  const submissionDiagnosticMessage = submissionDetail
    ? getSubmissionDiagnosticMessage(submissionDetail)
    : null

  async function submitSourceCode(): Promise<void> {
    if (!problem) {
      return
    }

    if (!sourceCode.trim()) {
      setSubmitErrorMessage('제출할 소스 코드를 입력해야 합니다.')

      return
    }

    setIsSubmitting(true)
    setSubmitErrorMessage(null)
    setCreatedSubmission(null)

    try {
      const nextCreatedSubmission = await createSubmissionWithCurrentSession({
        language: selectedLanguage,
        problemNumber: problem.problemNumber,
        sourceCode,
      })

      setCreatedSubmission(nextCreatedSubmission)
    } catch (error) {
      setSubmitErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-white p-6">
        <p className="text-sm font-bold text-slate-500">문제 정보를 불러오는 중입니다.</p>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="w-full bg-white p-6">
        <h1 className="text-xl font-black text-slate-950">
          {problemErrorMessage ?? '문제를 찾을 수 없습니다.'}
        </h1>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <div className="grid min-h-0 flex-1 grid-rows-[0.9fr_1.1fr] overflow-hidden lg:grid-cols-[minmax(360px,0.85fr)_minmax(520px,1.15fr)] lg:grid-rows-none">
        <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="flex shrink-0 items-center gap-6 border-b border-slate-200 px-5">
            <button
              className="border-b-2 border-blue-600 px-1 py-4 text-sm font-bold text-blue-700"
              type="button"
            >
              문제 설명
            </button>
            <button
              className="border-b-2 border-transparent px-1 py-4 text-sm font-bold text-slate-500 hover:text-slate-950"
              type="button"
            >
              내 제출
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge tone="blue">{problem.tag}</Badge>
              <Badge>{problem.timeLimitSeconds}s</Badge>
              <Badge>{problem.memoryLimitMegabytes}MB</Badge>
            </div>

            <div className="border-b border-slate-100 pb-6">
              <h2 className="text-xl font-black text-slate-950">
                {problem.problemNumber}. {problem.title}
              </h2>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {problem.statementMarkdown}
              </div>
            </div>

            <div className="pt-6">
              <h3 className="text-base font-black text-slate-950">입출력 예</h3>
              <div className="mt-4 grid gap-4">
                {problem.exampleTestCases.map((exampleTestCase) => (
                  <div className="grid gap-4 md:grid-cols-2" key={exampleTestCase.order}>
                    <div>
                      <div className="mb-2 text-xs font-black uppercase text-slate-400">
                        Input {exampleTestCase.order}
                      </div>
                      <pre className="min-h-16 overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        {exampleTestCase.input}
                      </pre>
                    </div>
                    <div>
                      <div className="mb-2 text-xs font-black uppercase text-slate-400">
                        Output {exampleTestCase.order}
                      </div>
                      <pre className="min-h-16 overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        {exampleTestCase.output}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 flex-col bg-white">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
            <div>
              <div className="text-xs font-bold uppercase text-slate-400">코드 작성</div>
              <div className="mt-1 text-sm font-black text-slate-950">
                solution.{selectedLanguage === 'cpp17' ? 'cpp' : 'py'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs font-bold text-slate-400 sm:inline">
                {selectedLanguageLabel}
              </span>
              <select
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                onChange={(event) =>
                  setSelectedLanguage(event.target.value as SubmissionLanguageDto)
                }
                value={selectedLanguage}
              >
                {submissionLanguageOptions.map((languageOption) => (
                  <option key={languageOption.value} value={languageOption.value}>
                    {languageOption.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex min-h-0 flex-1">
            <CodeEditor
              language={getEditorLanguage(selectedLanguage)}
              onChange={setSourceCode}
              value={sourceCode}
            />
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-slate-50">
            <div className="grid border-b border-slate-200 md:grid-cols-2">
              <div className="border-b border-slate-200 p-4 md:border-b-0 md:border-r">
                <div className="text-xs font-black uppercase text-slate-400">최근 제출</div>
                <div className="mt-2 text-sm font-bold text-slate-700">
                  {visibleSubmissionStatus ? (
                    <SubmissionStatusBadge status={visibleSubmissionStatus} />
                  ) : (
                    '제출 기록 없음'
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="text-xs font-black uppercase text-slate-400">제출 결과</div>
                <p className="mt-2 text-sm font-bold text-slate-700">
                  {createdSubmission
                    ? `${createdSubmission.id} · ${visibleSubmittedAt ?? createdSubmission.submittedAt}`
                    : '제출하면 채점 대기 상태로 등록됩니다.'}
                </p>
                {createdSubmission ? (
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {isSubmissionDetailLoading
                      ? '채점 결과를 확인하는 중입니다.'
                      : isPolling
                        ? '채점이 진행 중입니다.'
                        : submissionDetail
                          ? formatScorePercentage(submissionDetail.scorePercentage)
                          : '상세 결과 대기 중'}
                  </p>
                ) : null}
              </div>
            </div>

            {submitErrorMessage || submissionDetailErrorMessage ? (
              <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {submitErrorMessage ?? submissionDetailErrorMessage}
              </div>
            ) : null}

            {submissionDetail ? (
              <div className="max-h-48 overflow-y-auto border-b border-slate-200 bg-white px-4 py-3">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <SubmissionStatusBadge status={submissionDetail.status} />
                  <span className="text-xs font-bold text-slate-500">
                    {formatScorePercentage(submissionDetail.scorePercentage)}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {getLanguageLabel(submissionDetail.language)}
                  </span>
                </div>

                {submissionDiagnosticMessage ? (
                  <pre className="mb-3 max-h-24 overflow-auto rounded-md border border-rose-100 bg-rose-50 p-3 text-xs text-rose-800">
                    {submissionDiagnosticMessage}
                  </pre>
                ) : null}

                {submissionDetail.testCaseResults.length > 0 ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    {submissionDetail.testCaseResults.map((testCaseResult) => (
                      <div
                        className="rounded-md border border-slate-200 bg-slate-50 p-3"
                        key={testCaseResult.order}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-slate-500">
                            Case {testCaseResult.order}
                          </span>
                          <SubmissionStatusBadge status={testCaseResult.status} />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          {formatTestCaseResource(testCaseResult)}
                        </p>
                        {testCaseResult.message ? (
                          <p className="mt-2 whitespace-pre-wrap text-xs text-slate-600">
                            {testCaseResult.message}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-500">
                    {isPolling
                      ? '테스트 케이스 결과를 기다리는 중입니다.'
                      : '표시할 테스트 케이스 결과가 없습니다.'}
                  </p>
                )}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-slate-500 hover:bg-white hover:text-slate-950"
                onClick={() => setSourceCode(defaultSourceCode)}
                type="button"
              >
                <RotateCcw size={16} />
                초기화
              </button>
              <Button disabled={isSubmitting} onClick={submitSourceCode} type="button">
                <Send size={16} />
                {isSubmitting ? '제출 중' : '제출 후 채점하기'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
