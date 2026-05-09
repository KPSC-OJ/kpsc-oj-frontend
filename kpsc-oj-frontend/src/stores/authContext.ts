import { createContext } from 'react'
import type { AuthLoginResult, AuthSession, PendingSignup } from '../types/auth'

export type AuthContextValue = {
  clearPendingSignup: () => void
  completeSignup: (serviceUsername: string) => Promise<AuthSession>
  isAdmin: boolean
  isAuthenticated: boolean
  pendingSignup: PendingSignup | null
  requestWithFreshSession: <TResult>(
    request: (accessToken: string) => Promise<TResult>,
  ) => Promise<TResult>
  session: AuthSession | null
  signInWithGoogleIdToken: (idToken: string) => Promise<AuthLoginResult>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
