import { LinkButton } from '@/components/ui/Button'
import { usePageTitle } from '@/hooks/usePageTitle'

export function NotFoundPage() {
  usePageTitle('Page not found')
  return (
    <section className="container-page py-24">
      <p className="eyebrow">Error 404</p>
      <h1 className="display-lg mt-4">We could not find that page</h1>
      <p className="mt-4 max-w-md text-char-soft">
        The link may be old or mistyped. You can head back to the shop from here.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton to="/shop">Browse all slimes</LinkButton>
        <LinkButton to="/" variant="outline">
          Back to home
        </LinkButton>
      </div>
    </section>
  )
}
