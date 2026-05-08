import type { HTMLAttributes, ReactElement, ReactNode } from 'react'

type BadgeTone = 'blue' | 'emerald' | 'amber' | 'rose' | 'slate'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode
  tone?: BadgeTone
}

const toneClasses: Record<BadgeTone, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
}

export function Badge({
  children,
  className,
  tone = 'slate',
  ...props
}: BadgeProps): ReactElement {
  const badgeClassName = [
    'inline-flex items-center rounded px-2 py-1 text-xs font-bold ring-1 ring-inset',
    toneClasses[tone],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={badgeClassName} {...props}>
      {children}
    </span>
  )
}
