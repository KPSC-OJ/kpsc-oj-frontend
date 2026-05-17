import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import {
  completeFirstLoginSignup,
  refreshAuthSession,
  requestLogout,
  resolveAuthUserRole,
  startGoogleLogin,
} from '../services/authService'
import { AuthContext, type AuthContextValue } from './authContext'
import type {
  AuthApiError,
  AuthLoginResult,
  AuthSession,
  PendingSignup,
} from '../types/auth'

type AuthProviderProps = {
  children: ReactNode
}

const authStorageKey = 'kpsc_oj_auth_session'
const accessTokenRefreshSkewMillis = 60_000
const accessTokenRefreshRetryMillis = 30_000
const serviceUsernamePattern = /^[A-Za-z0-9_]{3,32}$/

function createAuthActionError(
  code: string,
  message: string,
  status: number,
): AuthApiError {
  return {
    code,
    message,
    status,
  }
}

function createChangedSessionError(): AuthApiError {
  return createAuthActionError('AUTH_SESSION_CHANGED', '인증 세션이 변경되었습니다.', 409)
}

function normalizeGoogleIdToken(idToken: string): string {
  const normalizedIdToken = idToken.trim()

  if (!normalizedIdToken) {
    throw createAuthActionError('INVALID_REQUEST', 'Google ID token을 입력해야 합니다.', 400)
  }

  return normalizedIdToken
}

function normalizeServiceUsername(serviceUsername: string): string {
  const normalizedServiceUsername = serviceUsername.trim()

  if (!normalizedServiceUsername) {
    throw createAuthActionError('INVALID_REQUEST', '서비스 아이디를 입력해야 합니다.', 400)
  }

  if (!serviceUsernamePattern.test(normalizedServiceUsername)) {
    throw createAuthActionError(
      'INVALID_REQUEST',
      '서비스 아이디는 3-32자의 영문, 숫자, underscore만 사용할 수 있습니다.',
      400,
    )
  }

  return normalizedServiceUsername
}

function isAuthFailure(error: unknown): boolean {
  const apiError = error as Partial<AuthApiError>

  return apiError.status === 401 || apiError.code === 'AUTHENTICATION_FAILED'
}

function shouldClearSessionAfterRefreshError(error: unknown): boolean {
  const apiError = error as Partial<AuthApiError>

  return (
    isAuthFailure(error) ||
    apiError.status === 400 ||
    apiError.code === 'INVALID_REQUEST'
  )
}

function isAccessTokenFresh(session: AuthSession): boolean {
  return Date.now() + accessTokenRefreshSkewMillis < session.expiresAtEpochMs
}

function readStoredSession(): AuthSession | null {
  const storedValue = window.localStorage.getItem(authStorageKey)

  if (!storedValue) {
    return null
  }

  try {
    const session = JSON.parse(storedValue) as Partial<AuthSession>

    if (
      typeof session.accessToken !== 'string' ||
      typeof session.refreshToken !== 'string' ||
      session.tokenType !== 'Bearer' ||
      typeof session.expiresInSeconds !== 'number' ||
      typeof session.serviceUsername !== 'string' ||
      typeof session.expiresAtEpochMs !== 'number'
    ) {
      window.localStorage.removeItem(authStorageKey)

      return null
    }

    return {
      accessToken: session.accessToken,
      expiresAtEpochMs: session.expiresAtEpochMs,
      expiresInSeconds: session.expiresInSeconds,
      refreshToken: session.refreshToken,
      role: resolveAuthUserRole({
        accessToken: session.accessToken,
        expiresInSeconds: session.expiresInSeconds,
        refreshToken: session.refreshToken,
        role: session.role,
        serviceUsername: session.serviceUsername,
        tokenType: session.tokenType,
      }),
      serviceUsername: session.serviceUsername,
      tokenType: session.tokenType,
    }
  } catch {
    window.localStorage.removeItem(authStorageKey)

    return null
  }
}

function persistSession(session: AuthSession): void {
  window.localStorage.setItem(authStorageKey, JSON.stringify(session))
}

function removeStoredSession(): void {
  window.localStorage.removeItem(authStorageKey)
}

/** 인증 세션, 최초 가입 대기 상태, localStorage persistence를 관리한다. */
export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession())
  const sessionRef = useRef<AuthSession | null>(session)
  const refreshPromiseRef = useRef<Promise<AuthSession> | null>(null)
  const [pendingSignup, setPendingSignup] = useState<PendingSignup | null>(null)

  const applySession = useCallback((nextSession: AuthSession): void => {
    persistSession(nextSession)
    sessionRef.current = nextSession
    setSession(nextSession)
  }, [])

  const clearSession = useCallback((): void => {
    removeStoredSession()
    sessionRef.current = null
    setSession(null)
    setPendingSignup(null)
  }, [])

  const signInWithGoogleIdToken = useCallback(
    async (idToken: string): Promise<AuthLoginResult> => {
      const normalizedIdToken = normalizeGoogleIdToken(idToken)
      const loginResult = await startGoogleLogin(normalizedIdToken)

      if (loginResult.kind === 'requiresSignup') {
        clearSession()
        setPendingSignup(loginResult.pendingSignup)

        return {
          kind: 'requiresSignup',
          pendingSignup: loginResult.pendingSignup,
        }
      }

      const nextSession = loginResult.session

      applySession(nextSession)
      setPendingSignup(null)

      return {
        kind: 'authenticated',
        session: nextSession,
      }
    },
    [applySession, clearSession],
  )

  const completeSignup = useCallback(
    async (serviceUsername: string): Promise<AuthSession> => {
      if (!pendingSignup) {
        throw createAuthActionError('SIGNUP_TOKEN_MISSING', '회원가입 토큰이 없습니다.', 400)
      }

      const normalizedServiceUsername = normalizeServiceUsername(serviceUsername)
      const nextSession = await completeFirstLoginSignup(
        pendingSignup.signupToken,
        normalizedServiceUsername,
      )

      applySession(nextSession)
      setPendingSignup(null)

      return nextSession
    },
    [applySession, pendingSignup],
  )

  const refreshCurrentSession = useCallback(
    async (options?: { force?: boolean }): Promise<AuthSession> => {
      const currentSession = sessionRef.current

      if (!currentSession) {
        throw createAuthActionError('AUTHENTICATION_FAILED', '로그인이 필요합니다.', 401)
      }

      if (!options?.force && isAccessTokenFresh(currentSession)) {
        return currentSession
      }

      if (!refreshPromiseRef.current) {
        refreshPromiseRef.current = refreshAuthSession(currentSession.refreshToken)
          .then((nextSession) => {
            const activeSession = sessionRef.current

            if (!activeSession || activeSession.refreshToken !== currentSession.refreshToken) {
              throw createChangedSessionError()
            }

            applySession(nextSession)

            return nextSession
          })
          .catch((error: unknown) => {
            if (shouldClearSessionAfterRefreshError(error)) {
              clearSession()
            }

            throw error
          })
          .finally(() => {
            refreshPromiseRef.current = null
          })
      }

      return refreshPromiseRef.current
    },
    [applySession, clearSession],
  )

  const getFreshAccessToken = useCallback(async (): Promise<string> => {
    const currentSession = sessionRef.current

    if (!currentSession) {
      throw createAuthActionError('AUTHENTICATION_FAILED', '로그인이 필요합니다.', 401)
    }

    if (isAccessTokenFresh(currentSession)) {
      return currentSession.accessToken
    }

    const nextSession = await refreshCurrentSession()

    return nextSession.accessToken
  }, [refreshCurrentSession])

  const requestWithFreshSession = useCallback(
    async <TResult,>(
      request: (accessToken: string) => Promise<TResult>,
    ): Promise<TResult> => {
      const accessToken = await getFreshAccessToken()

      try {
        return await request(accessToken)
      } catch (error) {
        if (!isAuthFailure(error)) {
          throw error
        }

        const nextSession = await refreshCurrentSession({ force: true })

        return request(nextSession.accessToken)
      }
    },
    [getFreshAccessToken, refreshCurrentSession],
  )

  useEffect(() => {
    const currentSession = sessionRef.current

    if (!currentSession) {
      return undefined
    }

    let isActive = true
    let refreshTimeoutId: ReturnType<typeof setTimeout> | null = null

    function scheduleRefresh(delayMillis: number): void {
      refreshTimeoutId = setTimeout(() => {
        void refreshCurrentSession().catch((error: unknown) => {
          if (!isActive || shouldClearSessionAfterRefreshError(error) || !sessionRef.current) {
            return
          }

          scheduleRefresh(accessTokenRefreshRetryMillis)
        })
      }, Math.max(delayMillis, 0))
    }

    scheduleRefresh(currentSession.expiresAtEpochMs - Date.now() - accessTokenRefreshSkewMillis)

    return () => {
      isActive = false

      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId)
      }
    }
  }, [refreshCurrentSession, session?.expiresAtEpochMs, session?.refreshToken])

  const signOut = useCallback(async (): Promise<void> => {
    const currentAccessToken = sessionRef.current?.accessToken

    clearSession()

    if (currentAccessToken) {
      await requestLogout(currentAccessToken)
    }
  }, [clearSession])

  const clearPendingSignup = useCallback((): void => {
    setPendingSignup(null)
  }, [])

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      clearPendingSignup,
      completeSignup,
      isAdmin: session?.role === 'ADMIN',
      isAuthenticated: Boolean(session),
      pendingSignup,
      requestWithFreshSession,
      session,
      signInWithGoogleIdToken,
      signOut,
    }),
    [
      clearPendingSignup,
      completeSignup,
      pendingSignup,
      requestWithFreshSession,
      session,
      signInWithGoogleIdToken,
      signOut,
    ],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
