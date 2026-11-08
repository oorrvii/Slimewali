import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'dark' | 'accent' | 'outline' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl border-2 font-sans font-bold leading-none select-none cursor-pointer transition-[transform,box-shadow,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-0'

const variants: Record<Variant, string> = {
  primary:
    'border-char bg-lime text-char shadow-pop hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_0_#343a35] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
  dark: 'border-char bg-char text-cream shadow-[4px_4px_0_0_#e98b62] hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_0_#e98b62] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
  accent:
    'border-char bg-orange text-char shadow-pop hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_0_#343a35] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
  outline:
    'border-char bg-white text-char shadow-pop-sm hover:bg-lime active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
  ghost: 'border-transparent bg-transparent text-char hover:bg-char/10 active:bg-char/15',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-10 px-4 text-sm',
  md: 'min-h-12 px-6 text-base',
  lg: 'min-h-14 px-8 text-lg',
}

type StyleProps = {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

export function buttonClasses({ variant = 'primary', size = 'md', fullWidth }: StyleProps) {
  return cn(base, variants[variant], sizes[size], fullWidth && 'w-full')
}

function Spinner() {
  return (
    <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

type ButtonProps = StyleProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean
    children: ReactNode
  }

export function Button({
  variant,
  size,
  fullWidth,
  loading,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  )
}

type LinkButtonProps = StyleProps & LinkProps & { children: ReactNode }

export function LinkButton({
  variant,
  size,
  fullWidth,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link className={cn(buttonClasses({ variant, size, fullWidth }), className)} {...rest}>
      {children}
    </Link>
  )
}
