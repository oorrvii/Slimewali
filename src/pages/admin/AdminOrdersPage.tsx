import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { listOrdersAdmin } from '@/data/orders'
import { ordersToCsv } from '@/domain/csv'
import { formatPaise } from '@/domain/money'
import { ORDER_STATUSES, orderStatusLabel, type OrderStatus } from '@/domain/status'
import { LoadError, LoadingBlock, PageHeader } from '@/features/admin/AdminParts'
import { OrderStatusBadge, PaymentBadge, formatDateTime, itemSummary } from '@/features/orders/OrderParts'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

function downloadCsv(text: string) {
  const blob = new Blob(['\uFEFF', text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `slimewali-orders-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function AdminOrdersPage() {
  usePageTitle('Orders')
  const orders = useAsync(listOrdersAdmin, [])
  const [status, setStatus] = useState<OrderStatus | 'all'>('pending_review')
  const [search, setSearch] = useState('')

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (orders.data ?? []).filter((order) => {
      if (status !== 'all' && order.orderStatus !== status) return false
      if (!term) return true
      return [order.orderNumber, order.customerName, order.customerEmail, order.customerPhone, order.customerInstagram]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [orders.data, status, search])

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Review new order requests, approve or reject them, and confirm the final amount."
        action={
          <Button
            variant="outline"
            size="sm"
            disabled={!orders.data || orders.data.length === 0}
            onClick={() => downloadCsv(ordersToCsv(orders.data ?? []))}
          >
            Download backup (CSV)
          </Button>
        }
      />

      {orders.loading ? <LoadingBlock label="Loading orders" /> : null}
      {orders.error ? <LoadError what="orders" onRetry={orders.reload} /> : null}

      {!orders.loading && !orders.error ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <Input
              label="Search"
              placeholder="Order number, name, email or phone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value as OrderStatus | 'all')}
            >
              <option value="all">All statuses</option>
              {ORDER_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {orderStatusLabel[value]}
                </option>
              ))}
            </Select>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-[1.25rem] border-2 border-dashed border-char bg-white/60 p-8 text-center text-char-soft">
              {(orders.data ?? []).length === 0
                ? 'No order requests yet. They will appear here as customers submit them.'
                : 'No orders match these filters.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {visible.map((order) => (
                <li key={order.id}>
                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="block rounded-[1.25rem] border-2 border-char bg-white p-4 transition-shadow hover:shadow-pop sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-xl font-bold">{order.orderNumber}</p>
                        <p className="text-sm text-char-soft">
                          {order.customerName} · {formatDateTime(order.createdAtMs)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <OrderStatusBadge status={order.orderStatus} />
                        <PaymentBadge status={order.paymentStatus} />
                      </div>
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
          {(orders.data ?? []).length >= 200 ? (
            <p className="mt-4 text-sm text-char-soft">Showing the latest 200 orders.</p>
          ) : null}
        </>
      ) : null}
    </>
  )
}
