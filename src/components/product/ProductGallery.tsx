import { useState } from 'react'
import { Blob } from '@/components/graphics/shapes'
import { imageUrl } from '@/data/media'
import { altTextFor, coverPathOf, type Product } from '@/domain/catalogue'
import { cn } from '@/lib/cn'

export function ProductGallery({ product }: { product: Product }) {
  const cover = coverPathOf(product)
  const ordered = cover ? [cover, ...product.imagePaths.filter((path) => path !== cover)] : []
  const [index, setIndex] = useState(0)
  const current = ordered[Math.min(index, ordered.length - 1)]

  if (ordered.length === 0) {
    return (
      <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-[1.25rem] border-2 border-char bg-lavender">
        <Blob variant={2} className="size-3/4 text-char/15" />
        <span className="absolute bottom-4 left-4 rounded-md border-2 border-char bg-white px-2 py-1 text-xs font-bold uppercase tracking-wider">
          Photo coming soon
        </span>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-hidden rounded-[1.25rem] border-2 border-char bg-white shadow-pop">
        <img
          src={imageUrl(current)}
          alt={altTextFor(product, current)}
          className="aspect-[4/5] size-full object-cover"
        />
      </div>
      {ordered.length > 1 ? (
        <ul className="mt-4 grid grid-cols-5 gap-2 sm:gap-3" aria-label="Product photos">
          {ordered.map((path, position) => (
            <li key={path}>
              <button
                type="button"
                onClick={() => setIndex(position)}
                aria-label={`Show photo ${position + 1} of ${ordered.length}`}
                aria-current={position === index}
                className={cn(
                  'block w-full overflow-hidden rounded-xl border-2 bg-white',
                  position === index ? 'border-char shadow-pop-sm' : 'border-char/30 hover:border-char',
                )}
              >
                <img
                  src={imageUrl(path, 'small')}
                  alt=""
                  loading="lazy"
                  className="aspect-square size-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
