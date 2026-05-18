import type { ReactElement } from 'react'
import { Badge } from '../common/Badge'
import type {
  ContestProblemSolvedStatusDto,
  ContestStatusDto,
  ContestVisibilityDto,
} from '../../types/contestApi'

const contestStatusLabels: Record<ContestStatusDto, string> = {
  DRAFT: '초안',
  ENDED: '종료',
  RUNNING: '진행중',
  SCHEDULED: '예정',
}

const contestProblemStatusLabels: Record<ContestProblemSolvedStatusDto, string> = {
  ATTEMPTED: '시도함',
  NOT_SUBMITTED: '미제출',
  SOLVED: '해결',
}

const contestVisibilityLabels: Record<ContestVisibilityDto, string> = {
  PRIVATE: '승인 필요',
  PUBLIC: '즉시 승인',
}

export function ContestStatusBadge({
  status,
}: {
  status: ContestStatusDto
}): ReactElement {
  const tone = status === 'RUNNING' ? 'emerald' : status === 'ENDED' ? 'slate' : 'amber'

  return <Badge tone={tone}>{contestStatusLabels[status]}</Badge>
}

export function ContestProblemStatusBadge({
  status,
}: {
  status: ContestProblemSolvedStatusDto
}): ReactElement {
  const tone = status === 'SOLVED' ? 'emerald' : status === 'ATTEMPTED' ? 'amber' : 'slate'

  return <Badge tone={tone}>{contestProblemStatusLabels[status]}</Badge>
}

export function ContestVisibilityBadge({
  visibility,
}: {
  visibility: ContestVisibilityDto
}): ReactElement {
  return (
    <Badge tone={visibility === 'PUBLIC' ? 'blue' : 'rose'}>
      {contestVisibilityLabels[visibility]}
    </Badge>
  )
}
