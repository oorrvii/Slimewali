import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'lime' | 'lavender' | 'orange' | 'char' | 'outline'

const tones: Record<BadgeTone, string> = {
  lime: 'bg-lime text-char border-char',
  lavender: 'bg-lavender text-char border-char',
  orange: 'bg-orange text-char border-char',
  char: 'bg-char text-cream border-char',
  outline: 'bg-white text-char border-char',
}

export function Badge({
  tone = 'lime',
  className,
  children,
}: {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border-2 px-2 py-0.5 text-xs font-bold uppercase leading-5 tracking-wider',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
