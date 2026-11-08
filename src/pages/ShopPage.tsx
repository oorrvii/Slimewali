import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductGrid'
import { StoreMessage } from '@/components/product/StoreMessage'
import { listPublishedProducts } from '@/data/products'
import { availabilityOf, priceRange, saleInfo, type Product } from '@/domain/catalogue'
import { parseRupeesToPaise } from '@/domain/money'
import { useActiveCategories } from '@/features/catalogue/useActiveCategories'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

type Sort = 'featured' | 'newest' | 'price_asc' | 'price_desc'

const PAGE_SIZE = 12

function sortProducts(list: Product[], sort: Sort): Product[] {
  const copy = [...list]
  switch (sort) {
    case 'newest':
      return copy.sort((a, b) => b.createdAtMs - a.createdAtMs)
    case 'price_asc':
      return copy.sort((a, b) => priceRange(a).minPaise - priceRange(b).minPaise)
    case 'price_desc':
      return copy.sort((a, b) => priceRange(b).minPaise - priceRange(a).minPaise)
    default:
      return copy.sort((a, b) => a.sortOrder - b.sortOrder || b.createdAtMs - a.createdAtMs)
  }
}

export function ShopPage() {
  usePageTitle('Shop', 'Shop handmade slime, shipped across India.')
  const products = useAsync(listPublishedProducts, [])
  const { categories } = useActiveCategories()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [onSaleOnly, setOnSaleOnly] = useState(() => new URLSearchParams(window.location.search).get('sale') === '1')
  const [minText, setMinText] = useState('')
  const [maxText, setMaxText] = useState('')
  const [sort, setSort] = useState<Sort>('featured')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const activeIds = useMemo(() => new Set(categories.map((category) => category.id)), [categories])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const min = minText.trim() ? parseRupeesToPaise(minText) : null
    const max = maxText.trim() ? parseRupeesToPaise(maxText) : null
    const list = (products.data ?? []).filter((product) => {
      if (activeIds.size > 0 && !activeIds.has(product.categoryId)) return false
      if (categoryId && product.categoryId !== categoryId) return false
      if (inStockOnly && availabilityOf(product) === 'out_of_stock') return false
      if (onSaleOnly && !saleInfo(product).onSale) return false
      const { minPaise } = priceRange(product)
      if (min !== null && minPaise < min) return false
      if (max !== null && minPaise > max) return false
      if (!term) return true
      return (
        product.name.toLowerCase().includes(term) ||
        product.shortDescription.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.tags.some((tag) => tag.toLowerCase().includes(term))
      )
    })
    return sortProducts(list, sort)
  }, [products.data, activeIds, search, categoryId, inStockOnly, onSaleOnly, minText, maxText, sort])

  const filtersActive =
    search !== '' || categoryId !== '' || inStockOnly || onSaleOnly || minText !== '' || maxText !== ''

  function reset() {
    setSearch('')
    setCategoryId('')
    setInStockOnly(false)
    setOnSaleOnly(false)
    setMinText('')
    setMaxText('')
    setVisibleCount(PAGE_SIZE)
  }

  const shown = filtered.slice(0, visibleCount)

  return (
    <section className="container-page py-10 sm:py-14">
      <p className="eyebrow text-lavender-ink">Shop</p>
      <h1 className="display-lg mt-2">All slimes</h1>

      <div className="mt-8 grid gap-4 rounded-[1.25rem] border-2 border-char bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 lg:p-5">
        <div className="sm:col-span-2">
          <Input
            label="Search"
            type="search"
            placeholder="Name, texture or description"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setVisibleCount(PAGE_SIZE)
            }}
          />
        </div>
        <Select
          label="Category"
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value)
            setVisibleCount(PAGE_SIZE)
          }}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select label="Sort by" value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
          <option value="featured">Featured order</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price, low to high</option>
          <option value="price_desc">Price, high to low</option>
        </Select>
        <Input
          label="Min price (₹)"
          inputMode="decimal"
          value={minText}
          onChange={(event) => {
            setMinText(event.target.value)
            setVisibleCount(PAGE_SIZE)
          }}
        />
        <Input
          label="Max price (₹)"
          inputMode="decimal"
          value={maxText}
          onChange={(event) => {
            setMaxText(event.target.value)
            setVisibleCount(PAGE_SIZE)
          }}
        />
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3 sm:col-span-2">
          <Toggle
            label="Show only products in stock"
            checked={inStockOnly}
            onChange={(event) => {
              setInStockOnly(event.target.checked)
              setVisibleCount(PAGE_SIZE)
            }}
          />
          <Toggle
            label="Show only products on sale"
            checked={onSaleOnly}
            onChange={(event) => {
              setOnSaleOnly(event.target.checked)
              setVisibleCount(PAGE_SIZE)
            }}
          />
        </div>
      </div>

      <div className="mt-8" aria-live="polite">
        {products.loading ? <ProductGridSkeleton /> : null}

        {products.error ? (
          <StoreMessage
            title="We could not load the shop"
            body="Please check your connection and try again."
            action={<Button onClick={products.reload}>Try again</Button>}
          />
        ) : null}

        {!products.loading && !products.error && (products.data ?? []).length === 0 ? (
          <StoreMessage
            title="New slimes are on their way"
            body="The shelves are being stocked. Please check back soon."
          />
        ) : null}

        {!products.loading && (products.data ?? []).length > 0 && filtered.length === 0 ? (
          <StoreMessage
            title="No slimes match those filters"
            body="Try a different search or clear the filters."
            action={<Button onClick={reset}>Reset filters</Button>}
          />
        ) : null}

        {shown.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-char-soft">
              Showing {shown.length} of {filtered.length} product{filtered.length === 1 ? '' : 's'}
              {filtersActive ? (
                <button
                  type="button"
                  onClick={reset}
                  className="ml-3 font-bold text-char underline underline-offset-4"
                >
                  Reset filters
                </button>
              ) : null}
            </p>
            <ProductGrid products={shown} />
            {filtered.length > shown.length ? (
              <div className="mt-10 flex justify-center">
                <Button variant="outline" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                  Show more
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  )
}
