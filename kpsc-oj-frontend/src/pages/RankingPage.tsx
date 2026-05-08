import { Medal } from 'lucide-react'
import { Card } from '../components/common/Card'

export function RankingPage() {
  return (
    <section>
      <div className="mb-6">
        <p className="text-sm font-bold text-blue-600">Ranking</p>
        <h1 className="text-2xl font-black text-slate-950">랭킹</h1>
        <p className="mt-1 text-sm text-slate-500">KPSC OJ 랭킹 기능을 준비하고 있습니다.</p>
      </div>

      <Card className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          <Medal size={20} />
        </div>
        <div>
          <h2 className="font-black text-slate-950">랭킹 집계 준비 중</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            제출과 채점 데이터가 안정적으로 쌓이면 해결 문제 수와 제출 기록을 기준으로
            랭킹을 제공할 예정입니다.
          </p>
        </div>
      </Card>
    </section>
  )
}
