import { useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { LinkButton } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { listAllCategories } from '@/data/categories'
import { listOrdersAdmin } from '@/data/orders'
import { listProductsAdmin } from '@/data/products'
import { availabilityOf } from '@/domain/catalogue'
import { LoadError, LoadingBlock, PageHeader } from '@/features/admin/AdminParts'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminOverviewPage() {
  usePageTitle('Admin')
  const products = useAsync(listProductsAdmin, [])
  const categories = useAsync(listAllCategories, [])
  const orders = useAsync(listOrdersAdmin, [])

  const stats = useMemo(() => {
    const list = products.data ?? []
    const live = list.filter((product) => product.status !== 'archived')
    return {
      published: list.filter((product) => product.status === 'published').length,
      drafts: list.filter((product) => product.status === 'draft').length,
      low: live.filter((product) => availabilityOf(product) === 'low_stock').length,
      out: live.filter((product) => availabilityOf(product) === 'out_of_stock').length,
      newOrders: (orders.data ?? []).filter((order) => order.orderStatus === 'pending_review').length,
      awaitingPayment: (orders.data ?? []).filter((order) => order.orderStatus === 'approved_awaiting_payment').length,
      activeCategories: (categories.data ?? []).filter((category) => category.isActive).length,
    }
  }, [products.data, categories.data, orders.data])

  const loading = products.loading || categories.loading || orders.loading
  const failed = products.error || categories.error || orders.error

  const tiles = [
    { label: 'New order requests', value: stats.newOrders, tone: 'lavender' as const },
    { label: 'Approved, awaiting payment', value: stats.awaitingPayment, tone: 'white' as const },
    { label: 'Published products', value: stats.published, tone: 'lime' as const },
    { label: 'Draft products', value: stats.drafts, tone: 'white' as const },
    { label: 'Low stock', value: stats.low, tone: 'lavender' as const },
    { label: 'Out of stock', value: stats.out, tone: 'white' as const },
    { label: 'Active categories', value: stats.activeCategories, tone: 'white' as const },
  ]

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="A quick look at your orders and catalogue."
      />

      {loading ? <LoadingBlock label="Loading overview" /> : null}
      {failed ? (
        <LoadError
          what="the overview"
          onRetry={() => {
            products.reload()
            categories.reload()
            orders.reload()
          }}
        />
      ) : null}

      {!loading && !failed ? (
        <>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {tiles.map((tile) => (
              <li key={tile.label}>
                <Card tone={tile.tone} pop>
                  <p className="font-display text-5xl font-extrabold leading-none">{tile.value}</p>
                  <p className="mt-3 text-sm font-bold">{tile.label}</p>
                </Card>
              </li>
            ))}
          </ul>

          {stats.activeCategories === 0 ? (
            <div className="mt-8">
              <Notice tone="info">Start by creating a category. Products are organised inside categories.</Notice>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton to="/admin/orders">Review orders</LinkButton>
            <LinkButton to="/admin/products/new" variant="outline">
              Add a product
            </LinkButton>
            <LinkButton to="/admin/categories" variant="outline">
              Manage categories
            </LinkButton>
            <LinkButton to="/admin/inventory" variant="outline">
              Check inventory
            </LinkButton>
          </div>
        </>
      ) : null}
    </>
  )
}
