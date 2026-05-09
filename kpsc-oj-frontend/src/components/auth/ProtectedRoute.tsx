import type { ReactElement, ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../stores/useAuth'
import type { AuthUserRole } from '../../types/auth'

type ProtectedRouteProps = {
  children: ReactNode
  requiredRole?: AuthUserRole
}

/** 인증 세션과 필요한 role을 확인해 허용되지 않은 화면 조립을 차단하는 라우트 경계다. */
export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps): ReactElement {
  const { isAuthenticated, session } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  if (requiredRole && session?.role !== requiredRole) {
    return <Navigate replace to="/problems" />
  }

  return <>{children}</>
}
