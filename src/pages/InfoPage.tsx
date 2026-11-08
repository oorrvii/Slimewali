import type { ReactNode } from 'react'
import { LinkButton } from '@/components/ui/Button'
import { getPublishedPage } from '@/data/content'
import { definitionOf, type PageId } from '@/domain/content'
import { RichText } from '@/features/content/RichText'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

export function InfoPage({ pageId, extra }: { pageId: PageId; extra?: (hasPage: boolean) => ReactNode }) {
  const definition = definitionOf(pageId)
  const page = useAsync(() => getPublishedPage(pageId), [pageId])
  usePageTitle(page.data?.title ?? definition.title)

  return (
    <section className="container-page py-14 sm:py-20">
      <div className="max-w-2xl">
        <h1 className="display-lg">{page.data?.title ?? definition.title}</h1>
        {page.loading ? (
          <div className="mt-8 space-y-3" role="status">
            <span className="sr-only">Loading</span>
            <div className="h-5 w-full animate-pulse rounded bg-char/10" />
            <div className="h-5 w-5/6 animate-pulse rounded bg-char/10" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-char/10" />
          </div>
        ) : page.data ? (
          <div className="mt-8">
            {page.data.body.trim() ? <RichText body={page.data.body} /> : null}
            {page.data.items.length > 0 ? (
              <dl className="mt-8 space-y-4">
                {page.data.items.map((item, index) => (
                  <div key={index} className="rounded-[1.25rem] border-2 border-char bg-white p-5">
                    <dt className="display-md">{item.question}</dt>
                    <dd className="mt-2 whitespace-pre-line text-char-soft">{item.answer}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        ) : page.error ? (
          <p className="mt-8 text-char-soft">
            We could not load this page.{' '}
            <button type="button" onClick={page.reload} className="font-bold underline underline-offset-4">
              Try again
            </button>
          </p>
        ) : (
          <p className="mt-8 text-lg text-char-soft">This page has not been published yet. Please check back soon.</p>
        )}
        {extra ? extra(Boolean(page.data)) : null}
        <LinkButton to="/" variant="outline" className="mt-10">
          Back to home
        </LinkButton>
      </div>
    </section>
  )
}
