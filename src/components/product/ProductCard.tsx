import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Blob, Spark } from '@/components/graphics/shapes'
import { formatPaise } from '@/domain/money'
import { cn } from '@/lib/cn'

export type ProductCardData = {
  slug: string
  name: string
  descriptor?: string
  pricePaise: number
  imageUrl?: string
  imageAlt?: string
  accent?: 'lime' | 'lavender' | 'orange'
  label?: 'New' | 'Featured'
  availability?: 'in_stock' | 'low_stock' | 'out_of_stock'
  pricePrefix?: string
  compareAtPaise?: number
  discountPercent?: number
  discountPrefix?: string
}

const accentBg = {
  lime: 'bg-lime text-lavender',
  lavender: 'bg-lavender text-lime',
  orange: 'bg-orange text-lime',
}

const availabilityText = {
  in_stock: null,
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
}

export function ProductCard({
  product,
  preview = false,
}: {
  product: ProductCardData
  preview?: boolean
}) {
  const { accent = 'lime', availability = 'in_stock' } = product
  const out = availability === 'out_of_stock'

  const frame =
    'block rounded-[1.25rem] border-2 border-char bg-white p-2 shadow-pop-sm transition-[transform,box-shadow] duration-200'
  const interactive = 'hover:-translate-y-1 hover:shadow-pop focus-visible:-translate-y-1 focus-visible:shadow-pop'

  const body = (
    <>
        <div
          className={cn(
            'relative aspect-[4/5] overflow-hidden rounded-xl border-2 border-char',
            product.imageUrl ? 'bg-cream' : accentBg[accent],
          )}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              loading="lazy"
              className={cn(
                'size-full object-cover transition-transform duration-500 group-hover:scale-105',
                out && 'opacity-60',
              )}
            />
          ) : (
            <div className="grid size-full place-items-center">
              <Blob variant={2} className="size-3/4 text-char/15" />
              <Spark className="absolute right-4 top-4 size-8 text-char/30" />
              <span className="absolute bottom-3 left-3 rounded-md border-2 border-char bg-white px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-char">
                Photo coming soon
              </span>
            </div>
          )}
          {product.discountPercent ? (
            <span className="absolute right-2 top-2 rotate-3 rounded-lg border-2 border-char bg-orange px-2.5 py-1 font-display text-sm font-extrabold uppercase text-char shadow-pop-sm">
              {product.discountPrefix}
              {product.discountPercent}% off
            </span>
          ) : null}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            {product.label ? (
              <Badge tone={product.label === 'New' ? 'orange' : 'lavender'}>{product.label}</Badge>
            ) : null}
            {availabilityText[availability] ? (
              <Badge tone={out ? 'char' : 'outline'}>{availabilityText[availability]}</Badge>
            ) : null}
          </div>
        </div>
        <div className="px-2 pb-2 pt-3">
          <h3 className="font-display text-xl font-bold leading-tight tracking-tight">
            {product.name}
          </h3>
          {product.descriptor ? (
            <p className="mt-1 text-sm text-char-soft">{product.descriptor}</p>
          ) : null}
          <p className="mt-3 font-display text-lg font-extrabold">
            {product.pricePrefix ? (
              <span className="mr-1 text-sm font-semibold text-char-soft">{product.pricePrefix}</span>
            ) : null}
            {formatPaise(product.pricePaise)}
            {product.compareAtPaise ? (
              <span className="ml-2 text-sm font-semibold text-char-soft line-through">
                {formatPaise(product.compareAtPaise)}
              </span>
            ) : null}
          </p>
        </div>
    </>
  )

  return (
    <article className="group relative">
      {preview ? (
        <div className={frame}>{body}</div>
      ) : (
        <Link to={`/product/${product.slug}`} className={cn(frame, interactive)}>
          {body}
        </Link>
      )}
    </article>
  )
}
