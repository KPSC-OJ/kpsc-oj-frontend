import { requestJson } from './apiClient'
import type {
  AuthApiError,
  AuthLoginResult,
  AuthSession,
  AuthTokenSet,
  AuthUserRole,
  GoogleAuthRequestDto,
  GoogleAuthResponseDto,
  LogoutResponseDto,
  RefreshRequestDto,
  SignupRequestDto,
} from '../types/auth'

function createAuthSession(tokens: AuthTokenSet): AuthSession {
  return {
    ...tokens,
    expiresAtEpochMs: Date.now() + tokens.expiresInSeconds * 1000,
    role: resolveAuthUserRole(tokens),
  }
}

function mapAuthTokenSetResponse(value: unknown, message: string): AuthTokenSet {
  if (!isAuthTokenSet(value)) {
    throw createInvalidAuthResponseError(message)
  }

  return value
}

function createInvalidAuthResponseError(message: string): AuthApiError {
  return {
    code: 'INVALID_AUTH_RESPONSE',
    message,
    status: 502,
  }
}

function isAuthTokenSet(value: unknown): value is AuthTokenSet {
  const candidate = value as Partial<AuthTokenSet> | null

  return Boolean(
    candidate &&
      typeof candidate.accessToken === 'string' &&
      typeof candidate.refreshToken === 'string' &&
      candidate.tokenType === 'Bearer' &&
      typeof candidate.expiresInSeconds === 'number' &&
      typeof candidate.serviceUsername === 'string' &&
      (candidate.role === undefined || isAuthUserRole(candidate.role)),
  )
}

function isAuthUserRole(value: unknown): value is AuthUserRole {
  return value === 'USER' || value === 'ADMIN'
}

function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
  const [, encodedPayload] = accessToken.split('.')

  if (!encodedPayload) {
    return null
  }

  try {
    const base64Payload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = base64Payload.padEnd(
      base64Payload.length + ((4 - (base64Payload.length % 4)) % 4),
      '=',
    )
    const payload = JSON.parse(atob(paddedPayload)) as unknown

    return payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function normalizeRoleClaimValue(value: unknown): AuthUserRole | null {
  if (value === 'ADMIN' || value === 'ROLE_ADMIN') {
    return 'ADMIN'
  }

  if (value === 'USER' || value === 'ROLE_USER') {
    return 'USER'
  }

  if (Array.isArray(value)) {
    return value.some((item) => normalizeRoleClaimValue(item) === 'ADMIN')
      ? 'ADMIN'
      : null
  }

  if (value && typeof value === 'object') {
    const roleObject = value as Record<string, unknown>

    return (
      normalizeRoleClaimValue(roleObject.role) ??
      normalizeRoleClaimValue(roleObject.authority) ??
      null
    )
  }

  if (typeof value === 'string') {
    return value
      .split(/[,\s]+/)
      .some((roleToken) => roleToken === 'ADMIN' || roleToken === 'ROLE_ADMIN')
      ? 'ADMIN'
      : null
  }

  return null
}

export function resolveAuthUserRole(tokens: AuthTokenSet): AuthUserRole {
  const jwtPayload = decodeJwtPayload(tokens.accessToken)

  if (jwtPayload) {
    const jwtRole =
      normalizeRoleClaimValue(jwtPayload.role) ??
      normalizeRoleClaimValue(jwtPayload.roles) ??
      normalizeRoleClaimValue(jwtPayload.authority) ??
      normalizeRoleClaimValue(jwtPayload.authorities) ??
      normalizeRoleClaimValue(jwtPayload.scope)

    if (jwtRole) {
      return jwtRole
    }
  }

  return tokens.role ?? 'USER'
}

function mapGoogleAuthResponse(response: GoogleAuthResponseDto): AuthLoginResult {
  if (typeof response.requiresSignup !== 'boolean') {
    throw createInvalidAuthResponseError('로그인 응답의 회원가입 여부가 올바르지 않습니다.')
  }

  if (response.requiresSignup) {
    if (typeof response.signupToken !== 'string' || typeof response.email !== 'string') {
      throw createInvalidAuthResponseError('회원가입 토큰 응답이 올바르지 않습니다.')
    }

    return {
      kind: 'requiresSignup',
      pendingSignup: {
        email: response.email,
        signupToken: response.signupToken,
      },
    }
  }

  const tokens = mapAuthTokenSetResponse(
    response.tokens,
    '로그인 토큰 응답이 올바르지 않습니다.',
  )

  return {
    kind: 'authenticated',
    session: createAuthSession(tokens),
  }
}

/** Google ID token 로그인 응답을 인증 완료 또는 최초 가입 대기 결과로 정규화한다. */
export async function startGoogleLogin(idToken: string): Promise<AuthLoginResult> {
  const response = await requestJson<GoogleAuthResponseDto>({
    body: { idToken } satisfies GoogleAuthRequestDto,
    method: 'POST',
    path: '/api/v1/auth/google',
  })

  return mapGoogleAuthResponse(response)
}

/** 최초 로그인 사용자의 서비스 아이디 등록을 완료하고 서비스 세션을 만든다. */
export async function completeFirstLoginSignup(
  signupToken: string,
  serviceUsername: string,
): Promise<AuthSession> {
  const response = await requestJson<unknown>({
    body: { serviceUsername, signupToken } satisfies SignupRequestDto,
    method: 'POST',
    path: '/api/v1/auth/signup',
  })
  const tokens = mapAuthTokenSetResponse(response, '회원가입 토큰 응답이 올바르지 않습니다.')

  return createAuthSession(tokens)
}

/** refresh token rotation으로 새 서비스 세션을 발급받는다. */
export async function refreshAuthSession(refreshToken: string): Promise<AuthSession> {
  const response = await requestJson<unknown>({
    body: { refreshToken } satisfies RefreshRequestDto,
    method: 'POST',
    path: '/api/v1/auth/refresh',
  })
  const tokens = mapAuthTokenSetResponse(response, '토큰 갱신 응답이 올바르지 않습니다.')

  return createAuthSession(tokens)
}

/** 현재 access token session을 백엔드에서 폐기한다. */
export async function requestLogout(accessToken: string): Promise<LogoutResponseDto> {
  return requestJson<LogoutResponseDto>({
    accessToken,
    method: 'POST',
    path: '/api/v1/auth/logout',
  })
}
