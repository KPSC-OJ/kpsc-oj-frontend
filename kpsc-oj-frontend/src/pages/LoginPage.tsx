import { useCallback, useState, type FormEvent, type ReactElement } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { GoogleIdentityButton } from '../components/auth/GoogleIdentityButton'
import { Button, ButtonLink } from '../components/common/Button'
import { Card } from '../components/common/Card'
import { useAuth } from '../stores/useAuth'
import type { AuthApiError } from '../types/auth'

function getErrorMessage(error: unknown): string {
  const apiError = error as Partial<AuthApiError>

  if (typeof apiError.message === 'string') {
    return apiError.message
  }

  return '로그인 요청을 처리하지 못했습니다.'
}

function getLoginRedirectPath(locationState: unknown): string {
  const from = (locationState as { from?: { pathname?: unknown } } | null)?.from

  return typeof from?.pathname === 'string' ? from.pathname : '/problems'
}

export function LoginPage(): ReactElement {
  const location = useLocation()
  const navigate = useNavigate()
  const redirectPath = getLoginRedirectPath(location.state)
  const {
    clearPendingSignup,
    completeSignup,
    isAuthenticated,
    pendingSignup,
    session,
    signInWithGoogleIdToken,
  } = useAuth()
  const [serviceUsername, setServiceUsername] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitGoogleIdToken = useCallback(
    async (nextIdToken: string): Promise<void> => {
      setIsSubmitting(true)
      setErrorMessage(null)

      try {
        const loginResult = await signInWithGoogleIdToken(nextIdToken)

        if (loginResult.kind === 'authenticated') {
          navigate(redirectPath, { replace: true })

          return
        }

        setServiceUsername('')
      } catch (error) {
        setErrorMessage(getErrorMessage(error))
      } finally {
        setIsSubmitting(false)
      }
    },
    [navigate, redirectPath, signInWithGoogleIdToken],
  )

  async function handleSignupSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await completeSignup(serviceUsername.trim())
      navigate(redirectPath, { replace: true })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancelSignup(): void {
    clearPendingSignup()
    setErrorMessage(null)
    setServiceUsername('')
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
      <div className="flex flex-col justify-center">
        <span className="mb-4 w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          국민대학교 전용 Online Judge
        </span>
        <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
          KPSC 문제 풀이를
          <br />
          바로 시작하세요
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
          학교 Google 계정으로 로그인하고 문제 풀이, 제출 기록, 랭킹을 한 곳에서 관리합니다.
          최초 로그인이라면 서비스 아이디만 등록하면 바로 이용할 수 있습니다.
        </p>
      </div>

      <Card>
        {isAuthenticated && session ? (
          <div>
            <h2 className="text-xl font-black text-slate-950">이미 로그인되어 있습니다.</h2>
            <p className="mt-2 text-sm text-slate-500">{session.serviceUsername}</p>
            <ButtonLink className="mt-5" to={redirectPath}>
              계속하기
            </ButtonLink>
          </div>
        ) : pendingSignup ? (
          <form onSubmit={handleSignupSubmit}>
            <div className="mb-5">
              <p className="text-sm font-bold text-blue-600">처음 오셨습니다</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">서비스 아이디 등록</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {pendingSignup.email} 계정으로 사용할 KPSC OJ 아이디를 정해주세요.
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">서비스 아이디</span>
              <input
                autoComplete="username"
                className="mt-2 w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                maxLength={32}
                minLength={3}
                onChange={(event) => setServiceUsername(event.target.value)}
                pattern="[A-Za-z0-9_]+"
                placeholder="kpsc_user"
                required
                value={serviceUsername}
              />
            </label>

            {errorMessage ? (
              <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                disabled={isSubmitting}
                onClick={handleCancelSignup}
                type="button"
                variant="ghost"
              >
                취소
              </Button>
              <Button disabled={isSubmitting} type="submit">
                <UserPlus size={16} />
                가입 완료
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <div className="mb-5">
              <p className="text-sm font-bold text-blue-600">로그인</p>
              <h2 className="mt-2 text-xl font-black text-slate-950">학교 계정으로 계속하기</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                KPSC OJ는 국민대학교 구성원을 위한 문제 풀이 플랫폼입니다.
              </p>
            </div>

            <div className="flex justify-center">
              <GoogleIdentityButton onCredential={submitGoogleIdToken} />
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {errorMessage}
              </div>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  )
}
