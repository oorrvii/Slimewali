import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

const blobPaths = {
  1: 'M100 12C140 8 188 34 190 82C192 124 160 132 168 160C176 188 130 196 96 188C60 180 30 190 16 150C2 110 36 96 28 62C20 30 62 16 100 12Z',
  2: 'M30 70C30 30 90 20 130 30C170 40 196 70 186 110C176 150 120 150 90 166C60 182 18 176 14 138C10 100 30 100 30 70Z',
  3: 'M104 10C150 14 176 52 184 94C192 138 150 190 100 190C50 190 12 150 14 100C16 50 58 6 104 10Z',
} as const

type ShapeProps = {
  className?: string
  outline?: boolean
}

export function Blob({
  variant = 1,
  className,
  outline,
}: ShapeProps & { variant?: 1 | 2 | 3 }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <path
        d={blobPaths[variant]}
        fill="currentColor"
        stroke={outline ? '#343a35' : 'none'}
        strokeWidth={outline ? 4 : 0}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function starPoints(points: number, outer: number, inner: number) {
  const out: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner
    const angle = (Math.PI * i) / points - Math.PI / 2
    out.push(`${(100 + radius * Math.cos(angle)).toFixed(2)},${(100 + radius * Math.sin(angle)).toFixed(2)}`)
  }
  return out.join(' ')
}

const burst = starPoints(14, 96, 74)

export function Starburst({ className, outline }: ShapeProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <polygon
        points={burst}
        fill="currentColor"
        stroke={outline ? '#343a35' : 'none'}
        strokeWidth={outline ? 4 : 0}
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Spark({ className, outline }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <path
        d="M50 2C54 30 70 46 98 50C70 54 54 70 50 98C46 70 30 54 2 50C30 46 46 30 50 2Z"
        fill="currentColor"
        stroke={outline ? '#343a35' : 'none'}
        strokeWidth={outline ? 3 : 0}
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Asterisk({ className }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <path
        d="M50 8V92M13.6 29L86.4 71M13.6 71L86.4 29"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

export function Squiggle({ className }: ShapeProps) {
  return (
    <svg
      viewBox="0 0 120 20"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2 10Q17 -2 32 10T62 10T92 10T118 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function Ring({ className }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="7" fill="none" />
    </svg>
  )
}

const stickerTones = {
  lime: 'bg-lime',
  lavender: 'bg-lavender',
  orange: 'bg-orange',
  white: 'bg-white',
} as const

export function Sticker({
  tone = 'lime',
  rotate = -4,
  className,
  children,
}: {
  tone?: keyof typeof stickerTones
  rotate?: number
  className?: string
  children: ReactNode
}) {
  return (
    <span
      style={{ transform: `rotate(${rotate}deg)` }}
      className={cn(
        'inline-block rounded-lg border-2 border-char px-3 py-1.5 font-display text-sm font-extrabold uppercase leading-none tracking-wide text-char shadow-pop-sm',
        stickerTones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
