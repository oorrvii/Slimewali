import { Link, useParams } from 'react-router-dom'
import { Button, LinkButton } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { StoreMessage } from '@/components/product/StoreMessage'
import { getMyOrder, listCustomerEvents } from '@/data/orders'
import { safeTrackingUrl } from '@/domain/order'
import { orderStatusNextStep } from '@/domain/status'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  AddressBlock,
  OrderBreakdown,
  OrderItemsList,
  OrderStatusBadge,
  PaymentBadge,
  Timeline,
  formatDateTime,
} from '@/features/orders/OrderParts'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AccountOrderDetailPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const uid = user?.uid ?? ''
  const order = useAsync(() => getMyOrder(id), [id])
  const events = useAsync(() => listCustomerEvents(id, uid), [id, uid])
  usePageTitle(order.data ? `Order ${order.data.orderNumber}` : 'Order')

  if (order.loading) {
    return (
      <div className="h-48 animate-pulse rounded-[1.25rem] bg-char/10" role="status">
        <span className="sr-only">Loading order</span>
      </div>
    )
  }

  if (order.error || !order.data) {
    return (
      <StoreMessage
        title="We could not find that order"
        body="It may not exist, or it may belong to another account."
        action={
          order.error ? (
            <Button onClick={order.reload}>Try again</Button>
          ) : (
            <LinkButton to="/account/orders">Back to my orders</LinkButton>
          )
        }
      />
    )
  }

  const data = order.data

  return (
    <div>
      <Link to="/account/orders" className="text-sm font-semibold underline underline-offset-4">
        All orders
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Order</p>
          <h1 className="display-lg mt-2">{data.orderNumber}</h1>
          <p className="mt-2 text-sm text-char-soft">Placed {formatDateTime(data.createdAtMs)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={data.orderStatus} />
          <PaymentBadge status={data.paymentStatus} />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Notice tone="info">{orderStatusNextStep[data.orderStatus]}</Notice>
        {data.customerVisibleNote ? <Notice tone="success">Note from us: {data.customerVisibleNote}</Notice> : null}
        {data.cancelReason ? <Notice tone="error">Reason for cancellation: {data.cancelReason}</Notice> : null}
        {data.orderStatus === 'approved_awaiting_payment' && data.contactStatus === 'payment_instructions_sent' ? (
          <Notice tone="info">We have sent you payment instructions by message. Please check your messages.</Notice>
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[1.25rem] border-2 border-char bg-white p-5">
          <h2 className="display-md mb-3">Items</h2>
          <OrderItemsList items={data.items} />
          <div className="mt-4">
            <OrderBreakdown order={data} />
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[1.25rem] border-2 border-char bg-white p-5">
            <h2 className="display-md mb-3">Shipping to</h2>
            <AddressBlock address={data.shippingAddress} />
            {data.note ? (
              <p className="mt-4 text-sm">
                <span className="font-bold">Your note: </span>
                <span className="text-char-soft">{data.note}</span>
              </p>
            ) : null}
          </section>
          {data.courierName ? (
            <section className="rounded-[1.25rem] border-2 border-char bg-white p-5">
              <h2 className="display-md mb-3">Tracking</h2>
              <p className="text-sm">
                <span className="font-bold">Courier: </span>
                {data.courierName}
              </p>
              {data.trackingReference ? (
                <p className="text-sm">
                  <span className="font-bold">Tracking number: </span>
                  {data.trackingReference}
                </p>
              ) : null}
              {safeTrackingUrl(data.trackingUrl) ? (
                <p className="mt-2 text-sm">
                  <a
                    href={safeTrackingUrl(data.trackingUrl) ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-4"
                  >
                    Track your parcel
                  </a>
                </p>
              ) : null}
            </section>
          ) : null}
          <section className="rounded-[1.25rem] border-2 border-char bg-white p-5">
            <h2 className="display-md mb-4">Progress</h2>
            <Timeline order={data} events={events.data ?? []} />
          </section>
          <p className="text-sm text-char-soft">
            Need help with this order?{' '}
            <Link to="/account/help" className="font-semibold underline underline-offset-4">
              Contact us
            </Link>{' '}
            and quote {data.orderNumber}.
          </p>
        </div>
      </div>
    </div>
  )
}
