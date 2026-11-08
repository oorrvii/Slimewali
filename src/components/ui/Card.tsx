import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: 'white' | 'cream' | 'lime' | 'lavender' | 'char'
  pop?: boolean
}

const tones = {
  white: 'bg-white text-char',
  cream: 'bg-cream text-char',
  lime: 'bg-lime text-char',
  lavender: 'bg-lavender text-char',
  char: 'bg-char text-cream',
}

export function Card({ tone = 'white', pop = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[1.25rem] border-2 border-char p-5 sm:p-6',
        tones[tone],
        pop && 'shadow-pop',
        className,
      )}
      {...rest}
    />
  )
}
