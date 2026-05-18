import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'

export function SiteFooter(): ReactElement {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="font-bold text-slate-700">KPSC OJ</p>
          <p className="mt-1 text-xs">국민대학교 온라인 저지 MVP</p>
        </div>

        <nav className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
          <Link className="hover:text-blue-700" to="/problems">
            문제
          </Link>
          <Link className="hover:text-blue-700" to="/submissions">
            제출
          </Link>
          <Link className="hover:text-blue-700" to="/ranking">
            랭킹
          </Link>
        </nav>
      </div>
    </footer>
  )
}
