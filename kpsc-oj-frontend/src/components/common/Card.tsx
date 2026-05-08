import type { HTMLAttributes, ReactElement, ReactNode } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function Card({ children, className, ...props }: CardProps): ReactElement {
  const cardClassName = [
    'rounded-lg border border-slate-200 bg-white p-5 shadow-sm',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cardClassName} {...props}>
      {children}
    </div>
  )
}
