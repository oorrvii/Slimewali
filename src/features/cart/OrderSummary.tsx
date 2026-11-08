import { useSettings } from '@/features/settings/SettingsProvider'
import { shippingDescription } from '@/domain/settings'
import { imageUrl } from '@/data/media'
import type { ResolvedLine } from '@/domain/cart'
import { formatPaise } from '@/domain/money'

export function SummaryLines({ lines }: { lines: ResolvedLine[] }) {
  return (
    <ul className="divide-y-2 divide-char/10">
      {lines.map((item) => (
        <li key={item.key} className="flex gap-3 py-3">
          <div className="size-16 shrink-0 overflow-hidden rounded-lg border-2 border-char bg-cream">
            {item.imagePath ? (
              <img src={imageUrl(item.imagePath, 'small')} alt="" className="size-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-bold">{item.name}</p>
            {item.variantLabel ? <p className="text-char-soft">{item.variantLabel}</p> : null}
            <p className="text-char-soft">
              {item.quantity} × {formatPaise(item.unitPaise)}
              {item.compareAtPaise !== null ? (
                <span className="ml-1 line-through">{formatPaise(item.compareAtPaise)}</span>
              ) : null}
            </p>
          </div>
          <p className="text-sm font-bold">{formatPaise(item.lineTotalPaise)}</p>
        </li>
      ))}
    </ul>
  )
}

export function Totals({ subtotalPaise, savingsPaise = 0 }: { subtotalPaise: number; savingsPaise?: number }) {
  const { settings } = useSettings()
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt>Subtotal</dt>
        <dd className="font-bold">{formatPaise(subtotalPaise)}</dd>
      </div>
      {savingsPaise > 0 ? (
        <div className="flex justify-between rounded-lg border-2 border-char bg-lime px-3 py-2 font-bold">
          <dt>You save</dt>
          <dd>{formatPaise(savingsPaise)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between gap-4">
        <dt>Shipping</dt>
        <dd className="text-right font-semibold">{shippingDescription(settings)}</dd>
      </div>
      <div className="flex justify-between border-t-2 border-char pt-3 font-display text-xl font-extrabold">
        <dt>Estimated total</dt>
        <dd>{formatPaise(subtotalPaise)}</dd>
      </div>
      {settings.shippingNote ? <p className="text-char-soft">{settings.shippingNote}</p> : null}
      <p className="text-char-soft">
        Final amount is confirmed by us after review. Cash on Delivery is not available, orders are
        prepaid only. Nothing is charged on this website.
      </p>
    </dl>
  )
}
