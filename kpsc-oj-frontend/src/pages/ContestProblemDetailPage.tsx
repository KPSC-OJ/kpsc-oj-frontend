import { useState, type ReactElement } from 'react'
import { Send } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button, ButtonLink } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { MarkdownContent } from '../components/common/MarkdownContent'
import { CodeEditor, type CodeEditorLanguage } from '../components/problem/CodeEditor'
import { ProblemExampleBlock } from '../components/problem/ProblemExampleBlock'
import { ContestSubmissionTable } from '../components/contest/ContestSubmissionTable'
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

const submissionLanguageOptions: Array<{
  editorLanguage: CodeEditorLanguage
  label: string
  value: SubmissionLanguageDto
}> = [
  { editorLanguage: 'cpp', label: 'C++17', value: 'cpp17' },
  { editorLanguage: 'python', label: 'Python 3', value: 'python3' },
]

function getEditorLanguage(language: SubmissionLanguageDto): CodeEditorLanguage {
  return (
    submissionLanguageOptions.find((languageOption) => languageOption.value === language)
      ?.editorLanguage ?? 'cpp'
  )
}

export function ContestProblemDetailPage(): ReactElement {
  const { contestProblemId } = useParams()
  const { contest, contestId, refreshContest } = useContestLayoutContext()
  const { isAuthenticated } = useAuth()
  const { errorMessage, isLoading, problem } = useContestProblem(contestId, contestProblemId)
  const { submitProblemWithCurrentSession } = useSubmitContestProblem()
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
  const sourceCodeLengthLabel = `${sourceCode.length.toLocaleString('ko-KR')} / ${SUBMISSION_SOURCE_CODE_MAX_LENGTH.toLocaleString('ko-KR')}자`
  const isSourceCodeOverLimit = sourceCode.length > SUBMISSION_SOURCE_CODE_MAX_LENGTH
  const problemSubmissions = contestProblemId
    ? submissions.filter((submission) => submission.contestProblemId === contestProblemId)
    : []
  const visibleCreatedSubmission = createdSubmission
    ? submissions.find((submission) => submission.id === createdSubmission.id)
    : null

  async function submitCurrentSourceCode(): Promise<void> {
    if (!contestProblemId) {
      return
    }

    if (!sourceCode.trim()) {
      setSubmitErrorMessage('제출할 소스 코드를 입력해야 합니다.')

      return
    }

    if (isSourceCodeOverLimit) {
      setSubmitErrorMessage('제출할 소스 코드는 최대 10,000자까지 입력할 수 있습니다.')

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
      <Card>
        <p className="text-sm font-semibold text-slate-500">대회 문제를 불러오는 중입니다.</p>
      </Card>
    )
  }

  if (!problem) {
    return (
      <Card>
        <h2 className="text-xl font-black text-slate-950">
          {errorMessage ?? '대회 문제를 찾을 수 없습니다.'}
        </h2>
      </Card>
    )
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 border-b border-slate-100 pb-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-black text-slate-600">
              {problem.label}
            </span>
            <span className="rounded bg-blue-50 px-2 py-1 text-xs font-black text-blue-700">
              {problem.score}점
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
          <h2 className="text-2xl font-black text-slate-950">{problem.title}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {problem.timeLimitMillis}ms · {problem.memoryLimitKb}KB
          </p>
        </div>

        <section className="grid gap-7">
          <div>
            <h3 className="mb-3 text-lg font-black text-slate-950">문제</h3>
            <MarkdownContent markdown={problem.statement} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-black text-slate-950">입력</h3>
            <MarkdownContent markdown={problem.inputDescription} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-black text-slate-950">출력</h3>
            <MarkdownContent markdown={problem.outputDescription} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-black text-slate-950">제약</h3>
            <MarkdownContent markdown={problem.constraints} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-black text-slate-950">예제</h3>
            <div className="grid gap-4">
              {problem.exampleTestCases.map((exampleTestCase) => (
                <div className="grid gap-4 md:grid-cols-2" key={exampleTestCase.caseOrder}>
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
        </section>
      </article>

      <aside className="grid gap-5">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">제출</h3>
              <p
                className={[
                  'text-xs font-bold',
                  isSourceCodeOverLimit ? 'text-rose-600' : 'text-slate-400',
                ].join(' ')}
              >
                {sourceCodeLengthLabel}
              </p>
            </div>
            <select
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
              onChange={(event) => setSelectedLanguage(event.target.value as SubmissionLanguageDto)}
              value={selectedLanguage}
            >
              {submissionLanguageOptions.map((languageOption) => (
                <option key={languageOption.value} value={languageOption.value}>
                  {languageOption.label}
                </option>
              ))}
            </select>
          </div>

          <div className="h-80 overflow-hidden rounded-md border border-slate-200">
            <CodeEditor
              language={getEditorLanguage(selectedLanguage)}
              onChange={setSourceCode}
              value={sourceCode}
            />
          </div>

          {submitErrorMessage ? (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {submitErrorMessage}
            </div>
          ) : null}

          {!canSubmit ? (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {isAuthenticated ? (
                <Link className="text-blue-700" to={`/contests/${contestId}`}>
                  참가 상태와 대회 진행 상태를 확인해주세요.
                </Link>
              ) : (
                <Link className="text-blue-700" to="/login">
                  로그인 후 제출할 수 있습니다.
                </Link>
              )}
            </div>
          ) : null}

          <div className="mt-4 flex justify-end">
            <Button
              disabled={!canSubmit || isSubmitting}
              onClick={() => void submitCurrentSourceCode()}
              type="button"
            >
              <Send size={16} />
              {isSubmitting ? '제출 중' : '제출'}
            </Button>
          </div>

          {createdSubmission ? (
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <SubmissionStatusBadge
                  status={visibleCreatedSubmission?.status ?? createdSubmission.status}
                />
                {isPolling ? (
                  <span className="text-xs font-bold text-slate-500">채점 갱신 중</span>
                ) : null}
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500">{createdSubmission.id}</p>
            </div>
          ) : null}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-lg font-black text-slate-950">내 제출</h3>
            <ButtonLink to={`/contests/${contestId}/submissions`} variant="secondary">
              전체 보기
            </ButtonLink>
          </div>
          {submissionsErrorMessage ? (
            <p className="text-sm font-semibold text-rose-700">{submissionsErrorMessage}</p>
          ) : problemSubmissions.length > 0 ? (
            <ContestSubmissionTable
              contestId={contestId}
              showSubmitter={false}
              submissions={problemSubmissions.slice(0, 5)}
            />
          ) : (
            <p className="text-sm font-semibold text-slate-500">이 문제의 제출 기록이 없습니다.</p>
          )}
        </Card>
      </aside>
    </div>
  )
}
