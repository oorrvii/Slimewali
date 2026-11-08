import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { Select } from '@/components/ui/Select'
import { listProductsAdmin } from '@/data/products'
import { availabilityOf, type Availability, type Product } from '@/domain/catalogue'
import {
  AvailabilityBadge,
  EmptyState,
  LoadError,
  LoadingBlock,
  PageHeader,
} from '@/features/admin/AdminParts'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

type Row = {
  key: string
  product: Product
  label: string
  stock: number
  availability: Availability
}

function toRows(products: Product[]): Row[] {
  return products
    .filter((product) => product.status !== 'archived')
    .flatMap((product): Row[] => {
      if (!product.hasVariants) {
        return [
          {
            key: product.id,
            product,
            label: 'Whole product',
            stock: product.stockQuantity,
            availability: availabilityOf(product),
          },
        ]
      }
      return product.variants.map((variant) => ({
        key: `${product.id}-${variant.id}`,
        product,
        label: variant.isActive ? variant.label : `${variant.label} (hidden)`,
        stock: variant.stockQuantity,
        availability: availabilityOf({
          hasVariants: false,
          variants: [],
          stockQuantity: variant.stockQuantity,
          lowStockThreshold: product.lowStockThreshold,
        }),
      }))
    })
}

export function AdminInventoryPage() {
  usePageTitle('Inventory · Admin')
  const products = useAsync(listProductsAdmin, [])
  const [filter, setFilter] = useState<'all' | 'attention'>('attention')

  const rows = useMemo(() => toRows(products.data ?? []), [products.data])
  const visible = rows.filter((row) => filter === 'all' || row.availability !== 'in_stock')

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="See what is running low or sold out. To change a quantity, open the product and edit its stock."
      />

      <div className="mb-6">
        <Notice tone="info">
          Stock changes are made in the product editor for now. A full adjustment history with
          reasons arrives together with order handling.
        </Notice>
      </div>

      <div className="mb-6 max-w-xs">
        <Select label="Show" value={filter} onChange={(event) => setFilter(event.target.value as 'all' | 'attention')}>
          <option value="attention">Low or out of stock</option>
          <option value="all">Everything</option>
        </Select>
      </div>

      {products.loading ? <LoadingBlock label="Loading inventory" /> : null}
      {products.error ? <LoadError what="inventory" onRetry={products.reload} /> : null}

      {!products.loading && !products.error && visible.length === 0 ? (
        <EmptyState
          title={filter === 'attention' ? 'Nothing needs attention' : 'No products yet'}
          body={
            filter === 'attention'
              ? 'Every product is comfortably in stock.'
              : 'Add a product to start tracking its stock.'
          }
          action={
            filter === 'attention' && rows.length > 0 ? (
              <Button variant="outline" onClick={() => setFilter('all')}>
                Show everything
              </Button>
            ) : undefined
          }
        />
      ) : null}

      <ul className="space-y-3">
        {visible.map((row) => (
          <li
            key={row.key}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border-2 border-char bg-white p-4"
          >
            <div className="min-w-0">
              <Link
                to={`/admin/products/${row.product.id}`}
                className="font-display text-lg font-bold underline-offset-4 hover:underline"
              >
                {row.product.name}
              </Link>
              <p className="text-sm text-char-soft">{row.label}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-display text-2xl font-extrabold">{row.stock}</p>
              <AvailabilityBadge availability={row.availability} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
