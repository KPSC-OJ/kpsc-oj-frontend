import { useOutletContext } from 'react-router-dom'
import type { ContestDetail } from '../types/contest'

export type ContestLayoutContextValue = {
  contest: ContestDetail
  contestId: string
  refreshContest: () => void
}

export function useContestLayoutContext(): ContestLayoutContextValue {
  return useOutletContext<ContestLayoutContextValue>()
}
