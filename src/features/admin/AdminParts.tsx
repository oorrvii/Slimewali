import type { ReactNode } from 'react'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import type { Availability, ProductStatus } from '@/domain/catalogue'

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display-lg">{title}</h1>
        {subtitle ? <p className="mt-3 max-w-xl text-char-soft">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  )
}

const statusTone: Record<ProductStatus, BadgeTone> = {
  draft: 'outline',
  published: 'lime',
  archived: 'char',
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <Badge tone={statusTone[status]}>{status}</Badge>
}

const availabilityLabel: Record<Availability, string> = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
}

const availabilityTone: Record<Availability, BadgeTone> = {
  in_stock: 'outline',
  low_stock: 'orange',
  out_of_stock: 'char',
}

export function AvailabilityBadge({ availability }: { availability: Availability }) {
  return <Badge tone={availabilityTone[availability]}>{availabilityLabel[availability]}</Badge>
}

export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="space-y-3">
      <div className="h-24 animate-pulse rounded-[1.25rem] bg-char/10" />
      <div className="h-24 animate-pulse rounded-[1.25rem] bg-char/10" />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function LoadError({ onRetry, what }: { onRetry: () => void; what: string }) {
  return (
    <Notice
      tone="error"
      action={
        <Button size="sm" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      }
    >
      We could not load {what}. Check your connection and try again.
    </Notice>
  )
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-[1.25rem] border-2 border-dashed border-char bg-white/60 p-8 text-center">
      <h2 className="display-md">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-char-soft">{body}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}
