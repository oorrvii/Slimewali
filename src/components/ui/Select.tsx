import { useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export function Select({
  label,
  hint,
  error,
  className,
  id,
  children,
  ...rest
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
} & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-bold">
        {label}
      </label>
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(
          'min-h-12 w-full rounded-xl border-2 bg-white px-3 text-base text-char focus-visible:shadow-pop-sm',
          error ? 'border-orange-ink' : 'border-char',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {hint && !error ? (
        <p id={`${fieldId}-hint`} className="text-sm text-char-soft">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${fieldId}-error`} className="text-sm font-semibold text-orange-ink">
          {error}
        </p>
      ) : null}
    </div>
  )
}
