import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppLayout } from './layouts/AppLayout'
import { ProblemWorkspaceLayout } from './layouts/ProblemWorkspaceLayout'
import { PublicLayout } from './layouts/PublicLayout'
import { AdminProblemEditPage } from './pages/AdminProblemEditPage'
import { AdminProblemNewPage } from './pages/AdminProblemNewPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ProblemsPage } from './pages/ProblemsPage'
import { RankingPage } from './pages/RankingPage'
import { SubmissionsPage } from './pages/SubmissionsPage'
import { SubmitPage } from './pages/SubmitPage'
import { AuthProvider } from './stores/authStore'
import { ThemeProvider } from './stores/themeStore'

function ProblemSubmitRedirect() {
  const { id } = useParams()

  return <Navigate replace to={id ? `/problems/${id}/submit` : '/problems'} />
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
            </Route>

            <Route element={<AppLayout />}>
              <Route
                path="problems"
                element={
                  <ProtectedRoute>
                    <ProblemsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="problems/:id"
                element={
                  <ProtectedRoute>
                    <ProblemSubmitRedirect />
                  </ProtectedRoute>
                }
              />
              <Route
                path="submissions"
                element={
                  <ProtectedRoute>
                    <SubmissionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="ranking"
                element={
                  <ProtectedRoute>
                    <RankingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/problems/new"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminProblemNewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/problems/:problemNumber/edit"
                element={
                  <ProtectedRoute>
                    <AdminProblemEditPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route element={<ProblemWorkspaceLayout />}>
              <Route
                path="problems/:id/submit"
                element={
                  <ProtectedRoute>
                    <SubmitPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
