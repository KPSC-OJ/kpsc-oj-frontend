import {
  useCallback,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import {
  completeFirstLoginSignup,
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
      typeof session.expiresAtEpochMs !== 'number' ||
      Date.now() >= session.expiresAtEpochMs
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
  const [pendingSignup, setPendingSignup] = useState<PendingSignup | null>(null)

  const signInWithGoogleIdToken = useCallback(
    async (idToken: string): Promise<AuthLoginResult> => {
      const normalizedIdToken = normalizeGoogleIdToken(idToken)
      const loginResult = await startGoogleLogin(normalizedIdToken)

      if (loginResult.kind === 'requiresSignup') {
        removeStoredSession()
        setSession(null)
        setPendingSignup(loginResult.pendingSignup)

        return {
          kind: 'requiresSignup',
          pendingSignup: loginResult.pendingSignup,
        }
      }

      const nextSession = loginResult.session

      persistSession(nextSession)
      setSession(nextSession)
      setPendingSignup(null)

      return {
        kind: 'authenticated',
        session: nextSession,
      }
    },
    [],
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

      persistSession(nextSession)
      setSession(nextSession)
      setPendingSignup(null)

      return nextSession
    },
    [pendingSignup],
  )

  const signOut = useCallback(async (): Promise<void> => {
    const currentAccessToken = session?.accessToken

    removeStoredSession()
    setSession(null)
    setPendingSignup(null)

    if (currentAccessToken) {
      await requestLogout(currentAccessToken)
    }
  }, [session])

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
      session,
      signInWithGoogleIdToken,
      signOut,
    }),
    [
      clearPendingSignup,
      completeSignup,
      pendingSignup,
      session,
      signInWithGoogleIdToken,
      signOut,
    ],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
