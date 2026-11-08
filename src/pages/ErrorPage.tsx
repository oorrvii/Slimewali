import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function ErrorPage() {
  const error = useRouteError()
  const missing = isRouteErrorResponse(error) && error.status === 404
  return (
    <section className="mx-auto max-w-2xl px-6 py-24">
      <p className="eyebrow">{missing ? 'Error 404' : 'Something went wrong'}</p>
      <h1 className="display-lg mt-4">{missing ? 'We could not find that page' : 'This page hit a problem'}</h1>
      <p className="mt-4 max-w-md text-char-soft">
        Nothing you entered was lost on our side. Reload the page, and if it keeps happening please tell us.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => window.location.reload()}>Reload</Button>
        <Button variant="outline" onClick={() => window.location.assign('/')}>
          Back to home
        </Button>
      </div>
    </section>
  )
}
