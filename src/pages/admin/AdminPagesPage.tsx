import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { listPagesAdmin } from '@/data/content'
import { PAGE_DEFINITIONS } from '@/domain/content'
import { LoadError, LoadingBlock, PageHeader } from '@/features/admin/AdminParts'
import { formatDateTime } from '@/features/orders/OrderParts'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminPagesPage() {
  usePageTitle('Pages · Admin')
  const pages = useAsync(listPagesAdmin, [])

  if (pages.loading) return <LoadingBlock label="Loading pages" />
  if (pages.error) return <LoadError what="the pages" onRetry={pages.reload} />

  return (
    <div>
      <PageHeader
        title="Pages"
        subtitle="About, FAQ, shipping, returns, privacy and terms. A page shows on the shop only when it is published. Nothing is written for you, especially the legal pages: write them yourself or have them checked before you publish."
      />
      <ul className="space-y-3">
        {PAGE_DEFINITIONS.map((definition) => {
          const page = pages.data?.get(definition.id)
          return (
            <li key={definition.id}>
              <Link
                to={`/admin/pages/${definition.id}`}
                className="flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border-2 border-char bg-white p-4 shadow-pop-sm transition-transform hover:-translate-y-0.5"
              >
                <span>
                  <span className="block font-display text-xl font-bold">{definition.title}</span>
                  <span className="text-sm text-char-soft">
                    {page && page.updatedAtMs ? `Edited ${formatDateTime(page.updatedAtMs)}` : 'Not written yet'}
                  </span>
                </span>
                <Badge tone={page?.isPublished ? 'lime' : 'outline'}>{page?.isPublished ? 'Published' : 'Not published'}</Badge>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
