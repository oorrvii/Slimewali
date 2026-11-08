import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

const tones = {
  info: 'bg-lavender',
  success: 'bg-lime',
  error: 'bg-orange',
}

export function Notice({
  tone = 'info',
  children,
  action,
}: {
  tone?: keyof typeof tones
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-char px-4 py-3 text-sm font-semibold text-char',
        tones[tone],
      )}
    >
      <span>{children}</span>
      {action}
    </div>
  )
}
