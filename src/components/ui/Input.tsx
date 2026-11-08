import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/cn'

type FieldMeta = {
  label: string
  hint?: string
  error?: string
}

const control =
  'w-full rounded-xl border-2 bg-white px-4 text-base text-char placeholder:text-char-soft transition-shadow focus-visible:shadow-pop-sm'

function Shell({
  id,
  label,
  hint,
  error,
  children,
}: FieldMeta & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-sm text-char-soft">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-semibold text-orange-ink">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function Input({
  label,
  hint,
  error,
  className,
  id,
  ...rest
}: FieldMeta & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <Shell id={fieldId} label={label} hint={hint} error={error}>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(control, 'min-h-12', error ? 'border-orange-ink' : 'border-char', className)}
        {...rest}
      />
    </Shell>
  )
}

export function Textarea({
  label,
  hint,
  error,
  className,
  id,
  rows = 4,
  ...rest
}: FieldMeta & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <Shell id={fieldId} label={label} hint={hint} error={error}>
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(control, 'py-3', error ? 'border-orange-ink' : 'border-char', className)}
        {...rest}
      />
    </Shell>
  )
}
