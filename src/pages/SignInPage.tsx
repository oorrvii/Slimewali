import { Link, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Blob, Spark } from '@/components/graphics/shapes'
import { useAuth } from '@/features/auth/AuthProvider'

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5Z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1Z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48Z" />
    </svg>
  )
}

export function SignInPage() {
  const { status, signIn, error, clearError } = useAuth()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const from = (location.state as { from?: string } | null)?.from ?? '/account'

  if (status === 'signed_in') {
    return <Navigate to={from} replace />
  }

  const handleClick = async () => {
    setBusy(true)
    await signIn()
    setBusy(false)
  }

  return (
    <section className="relative overflow-hidden">
      <div className="container-page grid min-h-[70dvh] items-center gap-12 py-12 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="eyebrow text-lavender-ink">Your account</p>
          <h1 className="display-lg mt-3">Sign in to send an order request.</h1>
          <p className="mt-6 max-w-md text-lg text-char-soft">
            You can browse and fill your cart without an account. We only ask you to sign in when
            you are ready to submit a request, so we can show you your orders and their status.
          </p>
        </div>

        <div className="relative">
          <Blob variant={3} outline className="absolute -right-6 -top-10 -z-10 size-40 text-lime" />
          <Spark outline className="absolute -bottom-8 -left-4 -z-10 size-20 text-orange" />
          <Card pop className="mx-auto max-w-md">
            <h2 className="display-md">Continue with Google</h2>
            <p className="mt-2 text-sm text-char-soft">
              No password to remember. We receive your name and email from Google to create your
              account.
            </p>

            {status === 'unconfigured' ? (
              <p
                role="alert"
                className="mt-5 rounded-xl border-2 border-char bg-lime p-3 text-sm font-semibold"
              >
                Sign-in is not connected yet. The owner needs to add the Firebase settings first.
              </p>
            ) : null}

            {error ? (
              <p role="alert" className="mt-5 text-sm font-semibold text-orange-ink">
                {error}
              </p>
            ) : null}

            <Button
              variant="outline"
              size="lg"
              fullWidth
              className="mt-6"
              loading={busy}
              disabled={status === 'unconfigured' || status === 'loading'}
              onClick={handleClick}
              onFocus={clearError}
            >
              {busy ? null : <GoogleMark />}
              {busy ? 'Opening Google' : 'Sign in with Google'}
            </Button>

            <p className="mt-5 text-xs text-char-soft">
              By continuing you agree to our{' '}
              <Link to="/terms" className="font-semibold underline underline-offset-2">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="font-semibold underline underline-offset-2">
                Privacy Policy
              </Link>
              .
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
