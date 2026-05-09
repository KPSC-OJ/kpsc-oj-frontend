import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

type ButtonSize = 'sm' | 'md' | 'lg'

type SharedButtonProps = {
  children: ReactNode
  className?: string
  size?: ButtonSize
  variant?: ButtonVariant
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & SharedButtonProps

type ButtonLinkProps = LinkProps & SharedButtonProps

const baseButtonClasses =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:outline-blue-600',
  secondary:
    'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-blue-600',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-blue-600',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:outline-rose-600',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3 text-base',
}

function getButtonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
): string {
  return [baseButtonClasses, variantClasses[variant], sizeClasses[size], className]
    .filter(Boolean)
    .join(' ')
}

export function Button({
  children,
  className,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps): ReactElement {
  return (
    <button className={getButtonClassName(variant, size, className)} type={type} {...props}>
      {children}
    </button>
  )
}

export function ButtonLink({
  children,
  className,
  size = 'md',
  variant = 'primary',
  ...props
}: ButtonLinkProps): ReactElement {
  return (
    <Link className={getButtonClassName(variant, size, className)} {...props}>
      {children}
    </Link>
  )
}
