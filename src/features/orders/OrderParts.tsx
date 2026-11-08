import { Badge } from '@/components/ui/Badge'
import { imageUrl } from '@/data/media'
import { formatPaise } from '@/domain/money'
import type { Order, OrderEvent, OrderItem, ShippingAddress } from '@/domain/order'
import {
  contactStatusLabel,
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
  type OrderStatus,
  type PaymentStatus,
} from '@/domain/status'

const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export function formatDateTime(ms: number): string {
  return ms > 0 ? dateFormat.format(new Date(ms)) : 'Just now'
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={orderStatusTone[status] ?? 'outline'}>{orderStatusLabel[status] ?? status}</Badge>
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={status === 'paid' ? 'lime' : 'outline'}>{paymentStatusLabel[status] ?? status}</Badge>
}

export function itemSummary(items: OrderItem[]): string {
  if (items.length === 0) return 'No items'
  const first = items[0].name
  return items.length === 1 ? first : `${first} and ${items.length - 1} more`
}

export function OrderItemsList({ items }: { items: OrderItem[] }) {
  return (
    <ul className="divide-y-2 divide-char/10">
      {items.map((item, index) => (
        <li key={`${item.productId}-${item.variantId ?? ''}-${index}`} className="flex gap-3 py-3">
          <div className="size-16 shrink-0 overflow-hidden rounded-lg border-2 border-char bg-cream">
            {item.imagePath ? (
              <img src={imageUrl(item.imagePath, 'small')} alt="" className="size-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-bold">{item.name}</p>
            {item.variantLabel ? <p className="text-char-soft">{item.variantLabel}</p> : null}
            <p className="text-char-soft">
              {item.quantity} × {formatPaise(item.unitPaise)}
            </p>
          </div>
          <p className="text-sm font-bold">{formatPaise(item.unitPaise * item.quantity)}</p>
        </li>
      ))}
    </ul>
  )
}

export function OrderBreakdown({ order }: { order: Order }) {
  const confirmed = order.finalTotalPaise !== null
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt>Items</dt>
        <dd className="font-bold">{formatPaise(order.subtotalPaise)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt>Shipping</dt>
        <dd className="text-right font-semibold">
          {order.shippingPaise !== null ? formatPaise(order.shippingPaise) : 'To be confirmed by us'}
        </dd>
      </div>
      <div className="flex justify-between border-t-2 border-char pt-3 font-display text-xl font-extrabold">
        <dt>{confirmed ? 'Total to pay' : 'Estimated total'}</dt>
        <dd>{formatPaise(order.finalTotalPaise ?? order.totalPaise)}</dd>
      </div>
      {!confirmed ? (
        <p className="text-char-soft">The final amount, including shipping, is confirmed after review.</p>
      ) : null}
    </dl>
  )
}

export function AddressBlock({ address }: { address: ShippingAddress }) {
  return (
    <address className="text-sm not-italic text-char-soft">
      <span className="font-bold text-char">{address.fullName}</span>
      <br />
      {address.line1}
      {address.line2 ? <><br />{address.line2}</> : null}
      {address.landmark ? <><br />Near {address.landmark}</> : null}
      <br />
      {address.city}, {address.state} {address.pinCode}
      <br />
      {address.phone}
    </address>
  )
}

export function Timeline({
  order,
  events,
  showInternal,
}: {
  order: Order
  events: OrderEvent[]
  showInternal?: boolean
}) {
  const rows = [
    { key: 'created', at: order.createdAtMs, text: 'Order request received', internal: false },
    ...events
      .filter((event) => showInternal || event.visibility === 'customer')
      .map((event) => ({
        key: event.id,
        at: event.createdAtMs,
        text: event.message,
        internal: event.visibility === 'internal',
      })),
  ]
  return (
    <ol className="space-y-4 border-l-2 border-char pl-5">
      {rows.map((row) => (
        <li key={row.key} className="relative">
          <span className="absolute -left-[1.6rem] top-1.5 size-3 rounded-full border-2 border-char bg-lime" />
          <p className="text-sm font-bold">
            {row.text}
            {row.internal ? <span className="ml-2 text-xs font-semibold text-char-soft">(internal)</span> : null}
          </p>
          <p className="text-xs text-char-soft">{formatDateTime(row.at)}</p>
        </li>
      ))}
    </ol>
  )
}

export function ContactStatusText({ status }: { status: Order['contactStatus'] }) {
  return <>{contactStatusLabel[status] ?? status}</>
}
