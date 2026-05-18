import { useState, type ReactElement } from 'react'
import { RotateCcw, Send } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button, ButtonLink } from '../components/common/Button'
import { MarkdownContent } from '../components/common/MarkdownContent'
import { ResizableSplitPane } from '../components/common/ResizableSplitPane'
import { ContestSubmissionTable } from '../components/contest/ContestSubmissionTable'
import { CodeEditor, type CodeEditorLanguage } from '../components/problem/CodeEditor'
import { ProblemExampleBlock } from '../components/problem/ProblemExampleBlock'
import { SubmissionStatusBadge } from '../components/submission/SubmissionStatusBadge'
import { getContestErrorMessage } from '../hooks/contestErrorMessage'
import {
  useContestProblem,
  useContestSubmissions,
  useSubmitContestProblem,
} from '../hooks/useContestData'
import { useContestLayoutContext } from '../layouts/contestLayoutContext'
import { useAuth } from '../stores/useAuth'
import type { ContestCreatedSubmission } from '../types/contest'
import {
  SUBMISSION_SOURCE_CODE_MAX_LENGTH,
  type SubmissionLanguageDto,
} from '../types/submissionApi'

const defaultContestSourceCode = `#include <iostream>
using namespace std;

int main() {
    return 0;
}`

const formattedSubmissionSourceCodeMaxLength =
  SUBMISSION_SOURCE_CODE_MAX_LENGTH.toLocaleString('ko-KR')

const submissionLanguageOptions: Array<{
  editorLanguage: CodeEditorLanguage
  label: string
  value: SubmissionLanguageDto
}> = [
  { editorLanguage: 'cpp', label: 'C++17', value: 'cpp17' },
  { editorLanguage: 'python', label: 'Python 3', value: 'python3' },
]

type ContestProblemPanelTab = 'statement' | 'submissions'

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

function getContestProblemPanelTabClassName(isActive: boolean): string {
  return [
    'border-b-2 px-1 py-4 text-sm font-bold transition',
    isActive
      ? 'border-blue-600 text-blue-700'
      : 'border-transparent text-slate-500 hover:text-slate-950',
  ].join(' ')
}

function formatContestSubmissionScore(scorePercentage: number | null | undefined): string {
  if (typeof scorePercentage === 'undefined') {
    return '점수 산정 전'
  }

  return scorePercentage === null ? '채점 전' : `${scorePercentage}%`
}

export function ContestProblemDetailPage(): ReactElement {
  const { contestProblemId } = useParams()
  const { contest, contestId, refreshContest } = useContestLayoutContext()
  const { isAuthenticated } = useAuth()
  const { errorMessage, isLoading, problem } = useContestProblem(contestId, contestProblemId)
  const { submitProblemWithCurrentSession } = useSubmitContestProblem()
  const [activeProblemPanelTab, setActiveProblemPanelTab] =
    useState<ContestProblemPanelTab>('statement')
  const [selectedLanguage, setSelectedLanguage] = useState<SubmissionLanguageDto>('cpp17')
  const [sourceCode, setSourceCode] = useState(defaultContestSourceCode)
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null)
  const [createdSubmission, setCreatedSubmission] = useState<ContestCreatedSubmission | null>(null)
  const [submissionRefreshKey, setSubmissionRefreshKey] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    errorMessage: submissionsErrorMessage,
    isPolling,
    submissions,
  } = useContestSubmissions(contestId, 'mine', submissionRefreshKey, Boolean(createdSubmission))

  const canSubmit =
    isAuthenticated && contest.status === 'RUNNING' && (contest.isParticipant || contest.isStaff)
  const isSourceCodeOverLimit = sourceCode.length > SUBMISSION_SOURCE_CODE_MAX_LENGTH
  const sourceCodeLengthClassName = [
    'text-xs font-bold',
    isSourceCodeOverLimit ? 'text-rose-600' : 'text-slate-400',
  ].join(' ')
  const selectedLanguageLabel = getLanguageLabel(selectedLanguage)
  const problemSubmissions = contestProblemId
    ? submissions.filter((submission) => submission.contestProblemId === contestProblemId)
    : []
  const latestProblemSubmission = problemSubmissions[0] ?? null
  const visibleCreatedSubmission = createdSubmission
    ? submissions.find((submission) => submission.id === createdSubmission.id)
    : null
  const visibleSubmissionStatus =
    visibleCreatedSubmission?.status ?? createdSubmission?.status ?? latestProblemSubmission?.status
  const visibleSubmissionScore = visibleCreatedSubmission
    ? formatContestSubmissionScore(visibleCreatedSubmission.scorePercentage)
    : latestProblemSubmission
      ? formatContestSubmissionScore(latestProblemSubmission.scorePercentage)
      : '제출 기록 없음'
  const visibleSubmittedAt =
    visibleCreatedSubmission?.submittedAt ??
    createdSubmission?.submittedAt ??
    latestProblemSubmission?.submittedAt

  async function submitCurrentSourceCode(): Promise<void> {
    if (!contestProblemId) {
      return
    }

    if (!sourceCode.trim()) {
      setSubmitErrorMessage('제출할 소스 코드를 입력해야 합니다.')

      return
    }

    if (isSourceCodeOverLimit) {
      setSubmitErrorMessage(
        `제출할 소스 코드는 최대 ${formattedSubmissionSourceCodeMaxLength}자까지 입력할 수 있습니다.`,
      )

      return
    }

    setIsSubmitting(true)
    setSubmitErrorMessage(null)

    try {
      const nextSubmission = await submitProblemWithCurrentSession(contestId, contestProblemId, {
        language: selectedLanguage,
        sourceCode,
      })

      setCreatedSubmission(nextSubmission)
      setSubmissionRefreshKey((currentRefreshKey) => currentRefreshKey + 1)
      refreshContest()
    } catch (error) {
      setSubmitErrorMessage(getContestErrorMessage(error, '대회 제출을 생성하지 못했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white p-6">
        <p className="text-sm font-bold text-slate-500">대회 문제를 불러오는 중입니다.</p>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="w-full bg-white p-6">
        <h2 className="text-xl font-black text-slate-950">
          {errorMessage ?? '대회 문제를 찾을 수 없습니다.'}
        </h2>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <ResizableSplitPane
        ariaLabel="대회 문제 영역과 코드 작성 영역 크기 조절"
        firstPane={
        <aside className="flex h-full min-h-0 w-full flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="flex shrink-0 items-center gap-6 border-b border-slate-200 px-5">
            <button
              aria-pressed={activeProblemPanelTab === 'statement'}
              className={getContestProblemPanelTabClassName(
                activeProblemPanelTab === 'statement',
              )}
              onClick={() => setActiveProblemPanelTab('statement')}
              type="button"
            >
              문제 설명
            </button>
            <button
              aria-pressed={activeProblemPanelTab === 'submissions'}
              className={getContestProblemPanelTabClassName(
                activeProblemPanelTab === 'submissions',
              )}
              onClick={() => setActiveProblemPanelTab('submissions')}
              type="button"
            >
              내 제출
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {activeProblemPanelTab === 'statement' ? (
              <>
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-black text-slate-600">
                    {problem.label}
                  </span>
                  <span className="rounded bg-blue-50 px-2 py-1 text-xs font-black text-blue-700">
                    {problem.score}점
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">
                    {problem.timeLimitMillis}ms
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">
                    {problem.memoryLimitKb}KB
                  </span>
                  {contest.isStaff ? (
                    <ButtonLink
                      size="sm"
                      to={`/contests/${contestId}/manage/problems/${problem.id}/edit`}
                      variant="secondary"
                    >
                      수정
                    </ButtonLink>
                  ) : null}
                </div>

                <div className="border-b border-slate-100 pb-6">
                  <h2 className="text-xl font-black text-slate-950">{problem.title}</h2>
                  <MarkdownContent className="mt-4" markdown={problem.statement} />
                </div>

                <section className="grid gap-7 pt-6">
                  <div>
                    <h3 className="mb-3 text-base font-black text-slate-950">입력</h3>
                    <MarkdownContent markdown={problem.inputDescription} />
                  </div>
                  <div>
                    <h3 className="mb-3 text-base font-black text-slate-950">출력</h3>
                    <MarkdownContent markdown={problem.outputDescription} />
                  </div>
                  <div>
                    <h3 className="mb-3 text-base font-black text-slate-950">제약</h3>
                    <MarkdownContent markdown={problem.constraints} />
                  </div>
                  <div>
                    <h3 className="mb-3 text-base font-black text-slate-950">예제</h3>
                    <div className="grid gap-4">
                      {problem.exampleTestCases.map((exampleTestCase) => (
                        <div
                          className="grid gap-4 md:grid-cols-2"
                          key={exampleTestCase.caseOrder}
                        >
                          <ProblemExampleBlock
                            label={`Input ${exampleTestCase.caseOrder}`}
                            value={exampleTestCase.input}
                          />
                          <ProblemExampleBlock
                            label={`Output ${exampleTestCase.caseOrder}`}
                            value={exampleTestCase.output}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  {problem.subtasks.length > 0 ? (
                    <div>
                      <h3 className="mb-3 text-base font-black text-slate-950">
                        서브테스크
                      </h3>
                      <div className="grid gap-3">
                        {problem.subtasks.map((subtask) => (
                          <div
                            className="rounded-md border border-slate-200 bg-slate-50 p-4"
                            key={subtask.order}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded bg-white px-2 py-1 font-mono text-xs font-black text-slate-600">
                                #{subtask.order}
                              </span>
                              <span className="rounded bg-blue-50 px-2 py-1 text-xs font-black text-blue-700">
                                {subtask.score}점
                              </span>
                              <span className="rounded bg-white px-2 py-1 text-xs font-black text-slate-600">
                                비공개 케이스 {subtask.testCases.length}개
                              </span>
                            </div>
                            <p className="mt-3 text-sm font-black text-slate-900">
                              {subtask.title}
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-500">
                              선행 서브테스크:{' '}
                              {subtask.prerequisiteSubtaskOrders.length > 0
                                ? subtask.prerequisiteSubtaskOrders.join(', ')
                                : '없음'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              </>
            ) : (
              <div className="grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-slate-950">내 제출</h3>
                    {isPolling ? (
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        채점 상태를 갱신하는 중입니다.
                      </p>
                    ) : null}
                  </div>
                  <ButtonLink to={`/contests/${contestId}/submissions`} variant="secondary">
                    전체 보기
                  </ButtonLink>
                </div>
                {submissionsErrorMessage ? (
                  <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {submissionsErrorMessage}
                  </p>
                ) : problemSubmissions.length > 0 ? (
                  <ContestSubmissionTable
                    contestId={contestId}
                    showSubmitter={false}
                    submissions={problemSubmissions.slice(0, 8)}
                  />
                ) : (
                  <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                    이 문제의 제출 기록이 없습니다.
                  </p>
                )}
              </div>
            )}
          </div>
        </aside>
        }
        secondPane={
        <div className="flex h-full min-h-0 w-full flex-col bg-white">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
            <div>
              <div className="text-xs font-bold uppercase text-slate-400">대회 제출</div>
              <div className="mt-1 text-sm font-black text-slate-950">
                solution.{selectedLanguage === 'cpp17' ? 'cpp' : 'py'}
              </div>
              <div className={sourceCodeLengthClassName}>
                {sourceCode.length.toLocaleString('ko-KR')} /{' '}
                {formattedSubmissionSourceCodeMaxLength}자
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
                  {visibleSubmittedAt
                    ? `${visibleSubmissionScore} · ${visibleSubmittedAt}`
                    : '제출하면 채점 대기 상태로 등록됩니다.'}
                </p>
                {createdSubmission ? (
                  <p className="mt-1 break-all text-xs font-semibold text-slate-500">
                    {createdSubmission.id}
                  </p>
                ) : null}
              </div>
            </div>

            {submitErrorMessage ? (
              <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {submitErrorMessage}
              </div>
            ) : null}

            {!canSubmit && !isAuthenticated ? (
              <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                <Link className="text-blue-700" to="/login">
                  로그인 후 제출할 수 있습니다.
                </Link>
              </div>
            ) : null}

            {createdSubmission ? (
              <div className="max-h-40 overflow-y-auto border-b border-slate-200 bg-white px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <SubmissionStatusBadge
                    status={visibleCreatedSubmission?.status ?? createdSubmission.status}
                  />
                  <span className="text-xs font-bold text-slate-500">
                    {formatContestSubmissionScore(visibleCreatedSubmission?.scorePercentage)}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {getLanguageLabel(createdSubmission.language)}
                  </span>
                  {isPolling ? (
                    <span className="text-xs font-bold text-slate-500">채점 갱신 중</span>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-slate-500 hover:bg-white hover:text-slate-950"
                onClick={() => setSourceCode(defaultContestSourceCode)}
                type="button"
              >
                <RotateCcw size={16} />
                초기화
              </button>
              <Button
                disabled={!canSubmit || isSubmitting}
                onClick={() => void submitCurrentSourceCode()}
                type="button"
              >
                <Send size={16} />
                {isSubmitting ? '제출 중' : '제출'}
              </Button>
            </div>
          </div>
        </div>
        }
      />
    </div>
  )
}
