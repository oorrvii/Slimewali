import { useParams } from 'react-router-dom'
import { LinkButton } from '@/components/ui/Button'
import { StoreMessage } from '@/components/product/StoreMessage'
import { getMyOrder } from '@/data/orders'
import { OrderBreakdown, OrderItemsList } from '@/features/orders/OrderParts'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

export function OrderConfirmationPage() {
  usePageTitle('Order request received')
  const { id = '' } = useParams()
  const result = useAsync(() => getMyOrder(id), [id])
  const order = result.data

  if (result.loading) {
    return (
      <section className="container-page py-14" role="status">
        <div className="h-40 max-w-2xl animate-pulse rounded-[1.25rem] bg-char/10" />
        <span className="sr-only">Loading your order</span>
      </section>
    )
  }

  if (!order) {
    return (
      <section className="container-page py-14">
        <StoreMessage
          title="We could not find that order"
          body="If you just placed it, check My orders in a moment."
          action={<LinkButton to="/account/orders">My orders</LinkButton>}
        />
      </section>
    )
  }

  return (
    <section className="container-page py-10 sm:py-14">
      <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:gap-12">
        <div>
          <p className="eyebrow">Order request received</p>
          <h1 className="display-lg mt-2">Thank you, we have your request.</h1>
          <p className="mt-5 text-lg">
            Your order reference is{' '}
            <span className="rounded-lg border-2 border-char bg-lime px-2 py-0.5 font-display font-extrabold">
              {order.orderNumber}
            </span>
          </p>
          <div className="mt-6 max-w-2xl space-y-3 text-char-soft">
            <p>
              This is a request, not a confirmed order. It is pending review. We will contact you using
              the details you gave us ({order.customerEmail}, {order.customerPhone}).
            </p>
            <p>
              Payment details are sent to you manually, and only after we approve the request. Please do
              not pay anyone before you hear from us. Nothing has been charged.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton to={`/account/orders/${order.id}`}>View this order</LinkButton>
            <LinkButton to="/shop" variant="outline">
              Continue shopping
            </LinkButton>
          </div>
        </div>
        <aside className="h-fit rounded-[1.25rem] border-2 border-char bg-white p-5 shadow-pop">
          <h2 className="display-md mb-3">Your request</h2>
          <OrderItemsList items={order.items} />
          <div className="mt-4">
            <OrderBreakdown order={order} />
          </div>
        </aside>
      </div>
    </section>
  )
}
