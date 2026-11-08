import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button, LinkButton } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Notice } from '@/components/ui/Notice'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductGrid'
import { StoreMessage } from '@/components/product/StoreMessage'
import { getPublishedProductBySlug, listPublishedByCategory } from '@/data/products'
import { activeVariants, availabilityOf, coverPathOf, discountPercent, type Product } from '@/domain/catalogue'
import { lineKey } from '@/domain/cart'
import { useCart } from '@/features/cart/CartProvider'
import { formatPaise } from '@/domain/money'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

const MAX_PER_ORDER = 10

function Details({ title, children }: { title: string; children: string }) {
  return (
    <details className="group border-b-2 border-char/20 py-4 first:border-t-2" open>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-display text-xl font-bold">
        {title}
        <span aria-hidden="true" className="text-2xl transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="mt-2 whitespace-pre-line text-char-soft">{children}</p>
    </details>
  )
}

function Related({ product }: { product: Product }) {
  const related = useAsync(() => listPublishedByCategory(product.categoryId), [product.categoryId])
  const others = (related.data ?? []).filter((item) => item.id !== product.id).slice(0, 4)
  if (!related.loading && others.length === 0) return null
  return (
    <section className="container-page pb-16">
      <h2 className="display-md mb-6">You might also like</h2>
      {related.loading ? <ProductGridSkeleton count={4} /> : <ProductGrid products={others} />}
    </section>
  )
}

export function ProductPage() {
  const { slug = '' } = useParams()
  const result = useAsync(() => getPublishedProductBySlug(slug), [slug])
  const product = result.data
  const [variantId, setVariantId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)
  const cart = useCart()

  usePageTitle(
    product ? product.seoTitle || product.name : 'Product',
    product ? product.seoDescription || product.shortDescription || undefined : undefined,
  )

  useEffect(() => {
    if (!product) return
    const first = activeVariants(product).find((variant) => variant.stockQuantity > 0) ?? activeVariants(product)[0]
    setVariantId(first?.id ?? '')
    setQuantity(1)
    setJustAdded(false)
  }, [product])

  if (result.loading) {
    return (
      <section className="container-page py-14">
        <ProductGridSkeleton count={2} />
      </section>
    )
  }

  if (result.error) {
    return (
      <section className="container-page py-14">
        <StoreMessage
          title="We could not load this product"
          body="Please check your connection and try again."
          action={<Button onClick={result.reload}>Try again</Button>}
        />
      </section>
    )
  }

  if (!product) {
    return (
      <section className="container-page py-14">
        <StoreMessage
          title="We could not find that product"
          body="It may no longer be available."
          action={<LinkButton to="/shop">Browse all slimes</LinkButton>}
        />
      </section>
    )
  }

  const variants = activeVariants(product)
  const selected = variants.find((variant) => variant.id === variantId)
  const unitPaise = product.hasVariants ? (selected?.pricePaise ?? 0) : product.pricePaise
  const stock = product.hasVariants ? (selected?.stockQuantity ?? 0) : product.stockQuantity
  const stockLimit = Math.max(0, Math.min(stock, MAX_PER_ORDER))
  const inCart =
    cart.lines.find(
      (line) => lineKey(line) === lineKey({ productId: product.id, variantId: product.hasVariants ? variantId : null }),
    )?.quantity ?? 0
  const maxQuantity = Math.max(0, stockLimit - inCart)
  const availability = availabilityOf(
    product.hasVariants
      ? { hasVariants: false, variants: [], stockQuantity: stock, lowStockThreshold: product.lowStockThreshold }
      : product,
  )
  const compareAtPaise = product.hasVariants ? (selected?.compareAtPaise ?? null) : product.compareAtPricePaise
  const percent = discountPercent(unitPaise, compareAtPaise)
  const showCompare = percent !== null

  return (
    <>
      <section className="container-page py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-char-soft">
          <Link to="/shop" className="underline underline-offset-4">
            Shop
          </Link>
          {product.categoryNameSnapshot ? <span> / {product.categoryNameSnapshot}</span> : null}
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery product={product} />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {product.isFeatured ? <Badge tone="lavender">Featured</Badge> : null}
              {availability === 'low_stock' ? <Badge tone="orange">Low stock</Badge> : null}
              {availability === 'out_of_stock' ? <Badge tone="char">Out of stock</Badge> : null}
            </div>
            <h1 className="display-lg mt-3">{product.name}</h1>
            {product.shortDescription ? (
              <p className="mt-4 text-lg text-char-soft">{product.shortDescription}</p>
            ) : null}

            <p className="mt-6 flex items-baseline gap-3 font-display text-4xl font-extrabold">
              {formatPaise(unitPaise)}
              {showCompare ? (
                <span className="text-xl font-semibold text-char-soft line-through">
                  {formatPaise(compareAtPaise as number)}
                </span>
              ) : null}
              {percent !== null ? (
                <span className="rounded-lg border-2 border-char bg-orange px-2.5 py-1 font-display text-base font-extrabold uppercase text-char">
                  {percent}% off
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-sm text-char-soft">Shipping is confirmed after we review your order.</p>

            {product.hasVariants ? (
              <div className="mt-6 max-w-xs">
                <Select
                  label="Option"
                  value={variantId}
                  onChange={(event) => {
                    setVariantId(event.target.value)
                    setQuantity(1)
                  }}
                >
                  {variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.label} · {formatPaise(variant.pricePaise)}
                      {discountPercent(variant.pricePaise, variant.compareAtPaise) !== null
                        ? ` · ${discountPercent(variant.pricePaise, variant.compareAtPaise)}% off`
                        : ''}
                      {variant.stockQuantity <= 0 ? ' · Out of stock' : ''}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-end gap-4">
              <div>
                <p id="qty-label" className="text-sm font-bold">
                  Quantity
                </p>
                <div
                  role="group"
                  aria-labelledby="qty-label"
                  className="mt-1.5 inline-flex items-center rounded-xl border-2 border-char bg-white"
                >
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1 || maxQuantity === 0}
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    className="grid size-12 place-items-center text-2xl font-bold disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-bold" aria-live="polite">
                    {maxQuantity === 0 ? 0 : quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= maxQuantity}
                    onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                    className="grid size-12 place-items-center text-2xl font-bold disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
              <Button
                size="lg"
                disabled={maxQuantity === 0}
                onClick={() => {
                  if (product.hasVariants && !selected) return
                  const cover = coverPathOf(product)
                  cart.add(
                    {
                      productId: product.id,
                      variantId: product.hasVariants ? variantId : null,
                      quantity,
                      name: product.name,
                      slug: product.slug,
                      variantLabel: selected?.label ?? '',
                      unitPaise,
                      imagePath: cover,
                    },
                    stockLimit,
                  )
                  setQuantity(1)
                  setJustAdded(true)
                }}
              >
                {stockLimit === 0 ? 'Out of stock' : maxQuantity === 0 ? 'Maximum in cart' : 'Add to cart'}
              </Button>
            </div>
            {justAdded ? (
              <div className="mt-4">
                <Notice
                  tone="success"
                  action={
                    <Link to="/cart" className="underline underline-offset-4">
                      View cart
                    </Link>
                  }
                >
                  Added to your cart.
                </Notice>
              </div>
            ) : null}
            {inCart > 0 && !justAdded ? (
              <p className="mt-3 text-sm text-char-soft">
                You already have {inCart} in your cart.{' '}
                <Link to="/cart" className="font-semibold underline underline-offset-4">
                  View cart
                </Link>
              </p>
            ) : null}

            <div className="mt-10">
              {product.description ? <Details title="About this slime">{product.description}</Details> : null}
              {product.careInstructions ? (
                <Details title="Care and storage">{product.careInstructions}</Details>
              ) : null}
              <Details title="Shipping and payment">
                {
                  'We ship across India. Cash on Delivery is not available, orders are prepaid only. Submitting an order is a request: we review it, then contact you with payment details. Nothing is charged on this website.'
                }
              </Details>
            </div>

            {product.tags.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tags">
                {product.tags.map((tag) => (
                  <li key={tag}>
                    <Badge tone="outline">{tag}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>
      <Related product={product} />
    </>
  )
}
