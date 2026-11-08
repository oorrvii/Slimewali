import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LinkButton } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from './AuthProvider'

function Screen({ badge, title, body, action }: { badge: string; title: string; body: string; action?: ReactNode }) {
  return (
    <section className="container-page py-24">
      <Badge tone="lavender">{badge}</Badge>
      <h1 className="display-lg mt-4">{title}</h1>
      <p className="mt-4 max-w-md text-char-soft">{body}</p>
      {action ? <div className="mt-8">{action}</div> : null}
    </section>
  )
}

function CheckingSession() {
  return (
    <section className="container-page py-24" role="status" aria-live="polite">
      <div className="h-6 w-28 animate-pulse rounded-md bg-char/10" />
      <div className="mt-6 h-16 w-full max-w-md animate-pulse rounded-xl bg-char/10" />
      <span className="sr-only">Checking your session</span>
    </section>
  )
}

function SetupNeeded() {
  return (
    <Screen
      badge="Setup needed"
      title="Sign-in is not connected yet"
      body="This site has not been linked to its Firebase project. The owner needs to add the Firebase settings to the environment file."
      action={<LinkButton to="/" variant="outline">Back to home</LinkButton>}
    />
  )
}

export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <CheckingSession />
  if (status === 'unconfigured') return <SetupNeeded />
  if (status === 'signed_out') {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}

export function RequireAdmin() {
  const { status, isAdmin } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <CheckingSession />
  if (status === 'unconfigured') return <SetupNeeded />
  if (status === 'signed_out') {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />
  }
  if (!isAdmin) {
    return (
      <Screen
        badge="403"
        title="You do not have access here"
        body="This area is only for the store owner."
        action={<LinkButton to="/" variant="outline">Back to home</LinkButton>}
      />
    )
  }
  return <Outlet />
}
