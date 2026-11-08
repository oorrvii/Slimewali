import { ProductCard } from './ProductCard'
import { toCardData } from '@/features/catalogue/cardData'
import type { Product } from '@/domain/catalogue'

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={toCardData(product)} />
        </li>
      ))}
    </ul>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      role="status"
      className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="aspect-[4/6] animate-pulse rounded-[1.25rem] bg-char/10" />
      ))}
      <span className="sr-only">Loading products</span>
    </div>
  )
}
