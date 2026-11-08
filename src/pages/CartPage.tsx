import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button, LinkButton } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { StoreMessage } from '@/components/product/StoreMessage'
import { imageUrl } from '@/data/media'
import { formatPaise } from '@/domain/money'
import { useCart } from '@/features/cart/CartProvider'
import { Totals } from '@/features/cart/OrderSummary'
import { useResolvedCart } from '@/features/cart/useResolvedCart'
import { usePageTitle } from '@/hooks/usePageTitle'

export function CartPage() {
  usePageTitle('Your cart')
  const cart = useCart()
  const { loading, error, reload, resolved, subtotal, savings, payable } = useResolvedCart()

  if (cart.lines.length === 0) {
    return (
      <section className="container-page py-14">
        <h1 className="display-lg mb-8">Your cart</h1>
        <StoreMessage
          title="Your cart is empty"
          body="Pick a few slimes and they will wait for you here."
          action={<LinkButton to="/shop">Browse all slimes</LinkButton>}
        />
      </section>
    )
  }

  if (error) {
    return (
      <section className="container-page py-14">
        <h1 className="display-lg mb-8">Your cart</h1>
        <StoreMessage
          title="We could not check your cart"
          body="Please check your connection and try again."
          action={<Button onClick={reload}>Try again</Button>}
        />
      </section>
    )
  }

  return (
    <section className="container-page py-10 sm:py-14">
      <h1 className="display-lg mb-8">Your cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:gap-12">
        <div>
          {loading ? (
            <div className="space-y-4" role="status">
              {cart.lines.map((line) => (
                <div key={`${line.productId}${line.variantId}`} className="h-32 animate-pulse rounded-[1.25rem] bg-char/10" />
              ))}
              <span className="sr-only">Checking prices and stock</span>
            </div>
          ) : (
            <ul className="space-y-4">
              {resolved.map((item) => (
                <li
                  key={item.key}
                  className="rounded-[1.25rem] border-2 border-char bg-white p-4 sm:p-5"
                >
                  <div className="flex gap-4">
                    <Link
                      to={`/product/${item.line.slug}`}
                      className="size-24 shrink-0 overflow-hidden rounded-xl border-2 border-char bg-cream sm:size-28"
                    >
                      {item.imagePath ? (
                        <img src={imageUrl(item.imagePath, 'small')} alt="" className="size-full object-cover" />
                      ) : null}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            to={`/product/${item.line.slug}`}
                            className="font-display text-xl font-bold hover:underline"
                          >
                            {item.name}
                          </Link>
                          {item.variantLabel ? (
                            <p className="text-sm text-char-soft">{item.variantLabel}</p>
                          ) : null}
                        </div>
                        {item.status === 'ok' ? (
                          <p className="font-display text-xl font-extrabold">
                            {formatPaise(item.lineTotalPaise)}
                          </p>
                        ) : (
                          <Badge tone="char">Unavailable</Badge>
                        )}
                      </div>

                      {item.status === 'ok' ? (
                        <p className="mt-1 text-sm text-char-soft">
                          {formatPaise(item.unitPaise)} each
                          {item.compareAtPaise !== null ? (
                            <span className="ml-2 line-through">{formatPaise(item.compareAtPaise)}</span>
                          ) : null}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm font-semibold text-orange-ink">
                          This item is no longer available. Remove it to continue.
                        </p>
                      )}
                      {item.priceChanged && item.status === 'ok' ? (
                        <p className="mt-1 text-sm font-semibold text-orange-ink">
                          The price changed from {formatPaise(item.line.unitPaise)}.
                        </p>
                      ) : null}
                      {item.quantityReduced ? (
                        <p className="mt-1 text-sm font-semibold text-orange-ink">
                          Only {item.maxQuantity} in stock right now.
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        {item.status === 'ok' ? (
                          <div
                            role="group"
                            aria-label={`Quantity for ${item.name}`}
                            className="inline-flex items-center rounded-xl border-2 border-char bg-white"
                          >
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${item.name}`}
                              disabled={item.quantity <= 1}
                              onClick={() => cart.setQuantity(item.key, item.quantity - 1)}
                              className="grid size-11 place-items-center text-2xl font-bold disabled:opacity-40"
                            >
                              −
                            </button>
                            <span className="w-9 text-center font-bold" aria-live="polite">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase quantity of ${item.name}`}
                              disabled={item.quantity >= item.maxQuantity}
                              onClick={() => cart.setQuantity(item.key, item.quantity + 1)}
                              className="grid size-11 place-items-center text-2xl font-bold disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => cart.remove(item.key)}
                          className="min-h-11 text-sm font-bold underline underline-offset-4"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6">
            <LinkButton to="/shop" variant="outline">
              Continue shopping
            </LinkButton>
          </div>
        </div>

        <aside className="h-fit rounded-[1.25rem] border-2 border-char bg-white p-5 shadow-pop lg:sticky lg:top-24">
          <h2 className="display-md mb-4">Summary</h2>
          <Totals subtotalPaise={subtotal} savingsPaise={savings} />
          <div className="mt-5">
            <Notice tone="info">
              This is an order request. We review it first, then contact you with payment details.
            </Notice>
          </div>
          <div className="mt-5">
            {payable.length > 0 && !loading ? (
              <LinkButton to="/checkout" size="lg" fullWidth>
                Proceed to checkout
              </LinkButton>
            ) : (
              <Button size="lg" fullWidth disabled>
                Proceed to checkout
              </Button>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
