import type { ReactElement } from 'react'
import { ButtonLink } from '../components/common/Button'
import { ContestNavigation } from '../components/contest/ContestNavigation'
import { SiteHeader } from '../components/layout/SiteHeader'

type ContestSiteHeaderProps = {
  contestId: string | undefined
}

/** 대회 전용 페이지에서 일반 OJ 내비게이션 대신 대회 탭을 Header 중앙에 표시한다. */
export function ContestSiteHeader({ contestId }: ContestSiteHeaderProps): ReactElement {
  return (
    <SiteHeader
      actionSlot={
        <ButtonLink size="sm" to="/contests" variant="secondary">
          OJ로 돌아가기
        </ButtonLink>
      }
      brandTo="/contests"
      navigationSlot={
        contestId ? <ContestNavigation contestId={contestId} variant="header" /> : undefined
      }
    />
  )
}
