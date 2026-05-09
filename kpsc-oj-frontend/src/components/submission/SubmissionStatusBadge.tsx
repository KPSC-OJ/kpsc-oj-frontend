import { Badge } from '../common/Badge'
import type { ReactElement } from 'react'

type SubmissionStatusBadgeProps = {
  status: string
}

const statusTone: Record<string, 'emerald' | 'amber' | 'rose' | 'blue' | 'slate'> = {
  ACCEPTED: 'emerald',
  COMPILE_ERROR: 'rose',
  INTERNAL_ERROR: 'rose',
  JUDGING: 'blue',
  MEMORY_LIMIT_EXCEEDED: 'amber',
  PENDING: 'slate',
  QUEUED: 'slate',
  RUNNING: 'blue',
  RUNTIME_ERROR: 'rose',
  TIME_LIMIT_EXCEEDED: 'amber',
  WRONG_ANSWER: 'rose',
}

const statusLabel: Record<string, string> = {
  ACCEPTED: 'Accepted',
  COMPILE_ERROR: 'Compile Error',
  INTERNAL_ERROR: 'Internal Error',
  JUDGING: 'Judging',
  MEMORY_LIMIT_EXCEEDED: 'Memory Limit Exceeded',
  PENDING: 'Pending',
  QUEUED: 'Queued',
  RUNNING: 'Running',
  RUNTIME_ERROR: 'Runtime Error',
  TIME_LIMIT_EXCEEDED: 'Time Limit Exceeded',
  WRONG_ANSWER: 'Wrong Answer',
}

export function SubmissionStatusBadge({ status }: SubmissionStatusBadgeProps): ReactElement {
  return <Badge tone={statusTone[status] ?? 'slate'}>{statusLabel[status] ?? status}</Badge>
}
