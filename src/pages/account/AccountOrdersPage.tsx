import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, LinkButton } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { StoreMessage } from '@/components/product/StoreMessage'
import { listMyOrders } from '@/data/orders'
import { formatPaise } from '@/domain/money'
import { ORDER_STATUSES, orderStatusLabel, type OrderStatus } from '@/domain/status'
import { useAuth } from '@/features/auth/AuthProvider'
import { OrderStatusBadge, formatDateTime, itemSummary } from '@/features/orders/OrderParts'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AccountOrdersPage() {
  usePageTitle('My orders')
  const { user } = useAuth()
  const uid = user?.uid ?? ''
  const orders = useAsync(() => listMyOrders(uid), [uid])
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')

  const visible = useMemo(
    () => (orders.data ?? []).filter((order) => filter === 'all' || order.orderStatus === filter),
    [orders.data, filter],
  )

  return (
    <div>
      <p className="eyebrow">My orders</p>
      <h1 className="display-lg mt-2">Your orders</h1>

      <div className="mt-8">
        {orders.loading ? (
          <div className="h-32 animate-pulse rounded-[1.25rem] bg-char/10" role="status">
            <span className="sr-only">Loading orders</span>
          </div>
        ) : orders.error ? (
          <StoreMessage
            title="We could not load your orders"
            body="Please check your connection and try again."
            action={<Button onClick={orders.reload}>Try again</Button>}
          />
        ) : (orders.data ?? []).length === 0 ? (
          <StoreMessage
            title="No orders yet"
            body="When you submit an order request, you can follow its status here."
            action={<LinkButton to="/shop">Browse all slimes</LinkButton>}
          />
        ) : (
          <>
            <div className="mb-5 max-w-xs">
              <Select
                label="Filter by status"
                value={filter}
                onChange={(event) => setFilter(event.target.value as OrderStatus | 'all')}
              >
                <option value="all">All orders</option>
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {orderStatusLabel[status]}
                  </option>
                ))}
              </Select>
            </div>
            {visible.length === 0 ? (
              <p className="text-char-soft">No orders with that status.</p>
            ) : (
              <ul className="space-y-4">
                {visible.map((order) => (
                  <li key={order.id}>
                    <Link
                      to={`/account/orders/${order.id}`}
                      className="block rounded-[1.25rem] border-2 border-char bg-white p-5 transition-shadow hover:shadow-pop"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-xl font-bold">{order.orderNumber}</p>
                          <p className="text-sm text-char-soft">{formatDateTime(order.createdAtMs)}</p>
                        </div>
                        <OrderStatusBadge status={order.orderStatus} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <p className="text-char-soft">{itemSummary(order.items)}</p>
                        <p className="font-bold">{formatPaise(order.finalTotalPaise ?? order.totalPaise)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
