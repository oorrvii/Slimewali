import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, LinkButton } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'
import { Select } from '@/components/ui/Select'
import { listAllCategories } from '@/data/categories'
import { imageUrl } from '@/data/media'
import { duplicateProduct, listProductsAdmin, setProductStatus } from '@/data/products'
import {
  availabilityOf,
  coverPathOf,
  priceRange,
  type Product,
  type ProductStatus,
} from '@/domain/catalogue'
import { formatPaise } from '@/domain/money'
import {
  AvailabilityBadge,
  EmptyState,
  LoadError,
  LoadingBlock,
  PageHeader,
  ProductStatusBadge,
} from '@/features/admin/AdminParts'
import { useAuth } from '@/features/auth/AuthProvider'
import { createDemoCatalogue, DEMO_PRODUCT_ID, removeDemoCatalogue } from '@/data/demo'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

function priceLabel(product: Product): string {
  const { minPaise, maxPaise } = priceRange(product)
  return minPaise === maxPaise
    ? formatPaise(minPaise)
    : `${formatPaise(minPaise)} – ${formatPaise(maxPaise)}`
}

export function AdminProductsPage() {
  usePageTitle('Products · Admin')
  const { user } = useAuth()
  const navigate = useNavigate()
  const actorUid = user?.uid ?? ''
  const products = useAsync(listProductsAdmin, [])
  const categories = useAsync(listAllCategories, [])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | ProductStatus>('all')
  const [categoryId, setCategoryId] = useState('')
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [archiving, setArchiving] = useState<Product | null>(null)
  const [busy, setBusy] = useState(false)
  const [demoBusy, setDemoBusy] = useState(false)
  const [confirmDemoRemoval, setConfirmDemoRemoval] = useState(false)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (products.data ?? []).filter((product) => {
      if (status !== 'all' && product.status !== status) return false
      if (categoryId && product.categoryId !== categoryId) return false
      if (!term) return true
      return (
        product.name.toLowerCase().includes(term) ||
        product.slug.includes(term) ||
        product.tags.some((tag) => tag.toLowerCase().includes(term))
      )
    })
  }, [products.data, search, status, categoryId])

  async function changeStatus(product: Product, next: ProductStatus) {
    try {
      await setProductStatus(product.id, next, actorUid)
      setMessage({ tone: 'success', text: `${product.name} is now ${next}.` })
      products.reload()
    } catch {
      setMessage({
        tone: 'error',
        text:
          next === 'published'
            ? 'Could not publish. A published product needs a name, category, price and at least one image.'
            : 'We could not update this product. Try again.',
      })
    }
  }

  async function confirmArchive() {
    if (!archiving) return
    setBusy(true)
    await changeStatus(archiving, 'archived')
    setBusy(false)
    setArchiving(null)
  }

  async function duplicate(product: Product) {
    try {
      const id = await duplicateProduct(product, actorUid)
      navigate(`/admin/products/${id}`)
    } catch {
      setMessage({ tone: 'error', text: 'We could not duplicate this product. Try again.' })
    }
  }

  const list = products.data ?? []
  const hasDemo = list.some((product) => product.id === DEMO_PRODUCT_ID)

  async function onAddDemo() {
    setDemoBusy(true)
    setMessage(null)
    try {
      await createDemoCatalogue(actorUid)
      setMessage({ tone: 'success', text: 'Demo product added. Open the shop to try the cart and checkout.' })
      products.reload()
      categories.reload()
    } catch {
      setMessage({ tone: 'error', text: 'We could not add the demo product. Please try again.' })
    } finally {
      setDemoBusy(false)
    }
  }

  async function onRemoveDemo() {
    setDemoBusy(true)
    setMessage(null)
    try {
      await removeDemoCatalogue()
      setConfirmDemoRemoval(false)
      setMessage({ tone: 'success', text: 'The demo product and demo category were removed.' })
      products.reload()
      categories.reload()
    } catch {
      setMessage({ tone: 'error', text: 'We could not remove the demo items. Please try again.' })
    } finally {
      setDemoBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Add, edit, publish and archive everything you sell."
        action={
          <div className="flex flex-wrap gap-3">
            {!hasDemo && !products.loading ? (
              <Button variant="outline" onClick={onAddDemo} loading={demoBusy}>
                Add demo product
              </Button>
            ) : null}
            {hasDemo ? (
              <Button variant="outline" onClick={() => setConfirmDemoRemoval(true)}>
                Remove demo product
              </Button>
            ) : null}
            <LinkButton to="/admin/products/new">New product</LinkButton>
          </div>
        }
      />

      {message ? (
        <div className="mb-6">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Input
          label="Search"
          placeholder="Name, slug or tag"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select label="Status" value={status} onChange={(event) => setStatus(event.target.value as 'all' | ProductStatus)}>
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
        <Select label="Category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">All categories</option>
          {(categories.data ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      {products.loading ? <LoadingBlock label="Loading products" /> : null}
      {products.error ? <LoadError what="products" onRetry={products.reload} /> : null}

      {!products.loading && !products.error && list.length === 0 ? (
        <EmptyState
          title="No products yet"
          body="Create a category first if you have not already, then add your first product."
          action={<LinkButton to="/admin/products/new">Add a product</LinkButton>}
        />
      ) : null}

      {!products.loading && list.length > 0 && filtered.length === 0 ? (
        <EmptyState
          title="No products match"
          body="Try a different search or clear the filters."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch('')
                setStatus('all')
                setCategoryId('')
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : null}

      <ul className="space-y-3">
        {filtered.map((product) => {
          const cover = coverPathOf(product)
          return (
            <li
              key={product.id}
              className="grid gap-4 rounded-[1.25rem] border-2 border-char bg-white p-4 sm:grid-cols-[5rem_1fr_auto] sm:items-center"
            >
              <div className="size-20 overflow-hidden rounded-xl border-2 border-char bg-cream">
                {cover ? (
                  <img src={imageUrl(cover, 'small')} alt="" className="size-full object-cover" />
                ) : (
                  <div className="grid size-full place-items-center px-1 text-center text-[10px] font-bold uppercase">
                    No image
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/admin/products/${product.id}`}
                    className="font-display text-xl font-bold leading-tight underline-offset-4 hover:underline"
                  >
                    {product.name}
                  </Link>
                  <ProductStatusBadge status={product.status} />
                  {product.isFeatured ? <span className="eyebrow text-lavender-ink">Featured</span> : null}
                </div>
                <p className="mt-1 text-sm text-char-soft">
                  {product.categoryNameSnapshot || 'No category'} · {priceLabel(product)}
                  {product.hasVariants ? ` · ${product.variants.length} variants` : ''}
                </p>
                <div className="mt-2">
                  <AvailabilityBadge availability={availabilityOf(product)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <LinkButton to={`/admin/products/${product.id}`} size="sm" variant="outline">
                  Edit
                </LinkButton>
                {product.status === 'published' ? (
                  <Button size="sm" variant="ghost" onClick={() => void changeStatus(product, 'draft')}>
                    Unpublish
                  </Button>
                ) : product.status === 'draft' ? (
                  <Button size="sm" variant="ghost" onClick={() => void changeStatus(product, 'published')}>
                    Publish
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => void changeStatus(product, 'draft')}>
                    Restore
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => void duplicate(product)}>
                  Duplicate
                </Button>
                {product.status !== 'archived' ? (
                  <Button size="sm" variant="ghost" onClick={() => setArchiving(product)}>
                    Archive
                  </Button>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={archiving !== null}
        title={`Archive ${archiving?.name ?? 'product'}?`}
        confirmLabel="Archive"
        danger
        busy={busy}
        onConfirm={() => void confirmArchive()}
        onCancel={() => setArchiving(null)}
      >
        <p>
          The product disappears from the shop. Orders already placed keep their own copy of the
          product details. You can restore it later.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDemoRemoval}
        title="Remove the demo product?"
        confirmLabel="Remove demo"
        danger
        busy={demoBusy}
        onConfirm={() => void onRemoveDemo()}
        onCancel={() => setConfirmDemoRemoval(false)}
      >
        <p>
          This permanently deletes the demo product and the demo category. Test orders already placed keep their own
          copy of the details.
        </p>
      </ConfirmDialog>
    </>
  )
}
