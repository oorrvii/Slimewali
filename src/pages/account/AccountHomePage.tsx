import { LinkButton } from '@/components/ui/Button'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/AuthProvider'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AccountHomePage() {
  usePageTitle('Your account')
  const { user, isAdmin, signOut } = useAuth()
  const firstName = user?.displayName.split(' ')[0] || 'there'

  return (
    <div>
      <p className="eyebrow">Overview</p>
      <h1 className="display-lg mt-2">Hi, {firstName}.</h1>
      <p className="mt-3 text-char-soft">Signed in as {user?.email}.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.25rem] border-2 border-char bg-white p-5">
          <h2 className="font-display text-xl font-bold">Recent orders</h2>
          <p className="mt-2 text-char-soft">
            You have no orders yet. Order requests you submit will show up here with their status.
          </p>
          <div className="mt-4">
            <LinkButton to="/shop" size="sm">
              Browse the shop
            </LinkButton>
          </div>
        </div>
        <div className="rounded-[1.25rem] border-2 border-char bg-white p-5">
          <h2 className="font-display text-xl font-bold">Quick links</h2>
          <ul className="mt-3 space-y-1 font-semibold">
            <li>
              <LinkButton to="/cart" variant="ghost" size="sm">
                Your cart
              </LinkButton>
            </li>
            <li>
              <LinkButton to="/account/addresses" variant="ghost" size="sm">
                Saved addresses
              </LinkButton>
            </li>
            <li>
              <LinkButton to="/account/help" variant="ghost" size="sm">
                Help and contact
              </LinkButton>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {isAdmin ? <LinkButton to="/admin">Open admin</LinkButton> : null}
        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </div>
  )
}
