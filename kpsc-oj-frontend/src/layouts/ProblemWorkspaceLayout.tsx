import { Outlet } from 'react-router-dom'
import { SiteHeader } from '../components/layout/SiteHeader'

export function ProblemWorkspaceLayout() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-950">
      <SiteHeader />
      <main className="flex min-h-0 flex-1 overflow-hidden bg-white">
        <Outlet />
      </main>
    </div>
  )
}
