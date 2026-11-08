import { useId, type InputHTMLAttributes } from 'react'

export function Toggle({
  label,
  hint,
  id,
  ...rest
}: { label: string; hint?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <div className="flex items-start gap-3">
      <input
        id={fieldId}
        type="checkbox"
        aria-describedby={hint ? `${fieldId}-hint` : undefined}
        className="toggle-box mt-0.5 size-6 shrink-0 cursor-pointer appearance-none rounded-md border-2 border-char bg-white checked:bg-lime disabled:cursor-not-allowed disabled:opacity-50"
        {...rest}
      />
      <label htmlFor={fieldId} className="cursor-pointer text-sm">
        <span className="font-bold">{label}</span>
        {hint ? (
          <span id={`${fieldId}-hint`} className="block text-char-soft">
            {hint}
          </span>
        ) : null}
      </label>
    </div>
  )
}
