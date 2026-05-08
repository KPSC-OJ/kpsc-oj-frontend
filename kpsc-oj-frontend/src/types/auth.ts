export type AuthUserRole = 'USER' | 'ADMIN'

export type AuthTokenSet = {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresInSeconds: number
  serviceUsername: string
  role?: AuthUserRole
}

export type AuthSession = AuthTokenSet & {
  expiresAtEpochMs: number
  role: AuthUserRole
}

export type GoogleAuthRequestDto = {
  idToken: string
}

export type GoogleAuthResponseDto = {
  requiresSignup: boolean
  tokens?: AuthTokenSet
  signupToken?: string
  email?: string
}

export type SignupRequestDto = {
  serviceUsername: string
  signupToken: string
}

export type LogoutResponseDto = {
  loggedOut: boolean
}

export type AuthApiError = {
  code: string
  message: string
  status: number
}

export type PendingSignup = {
  email: string
  signupToken: string
}

export type AuthLoginResult =
  | {
      kind: 'authenticated'
      session: AuthSession
    }
  | {
      kind: 'requiresSignup'
      pendingSignup: PendingSignup
    }
