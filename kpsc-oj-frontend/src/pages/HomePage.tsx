import { ArrowRight, ClipboardList, Code2, ShieldPlus } from 'lucide-react'
import { ButtonLink } from '../components/common/Button'
import { Card } from '../components/common/Card'

export function HomePage() {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-14">
      <div className="flex flex-col justify-center">
        <h1 className="text-4xl font-black text-slate-950 sm:text-5xl">
          KPSC 문제 풀이 대시보드
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
          학교 계정으로 로그인한 뒤 문제 목록을 조회하고, 소스 코드를 제출하고, 내 제출
          결과를 확인할 수 있습니다.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink size="lg" to="/problems">
            문제 풀러가기
            <ArrowRight size={18} />
          </ButtonLink>
          <ButtonLink size="lg" to="/submissions" variant="secondary">
            내 제출 보기
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <div className="flex items-start gap-3">
            <Code2 className="mt-1 text-blue-600" size={22} />
            <div>
              <h2 className="font-black text-slate-950">문제 풀이</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                등록된 문제를 백엔드 API에서 조회하고 제출 화면으로 이동합니다.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <ClipboardList className="mt-1 text-emerald-600" size={22} />
            <div>
              <h2 className="font-black text-slate-950">제출 기록</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                내 제출 목록과 채점 상태를 백엔드 API 기준으로 확인합니다.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <ShieldPlus className="mt-1 text-amber-600" size={22} />
            <div>
              <h2 className="font-black text-slate-950">문제 출제</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                관리자 권한이 있는 사용자는 문제와 테스트 케이스를 등록할 수 있습니다.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
