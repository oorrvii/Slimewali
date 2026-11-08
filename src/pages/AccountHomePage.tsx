import { Button, LinkButton } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/features/auth/AuthProvider'

export function AccountHomePage() {
  const { user, isAdmin, signOut } = useAuth()
  const firstName = user?.displayName.split(' ')[0] || 'there'

  return (
    <section className="container-page py-16">
      <Badge tone="lavender">Phase 2 placeholder</Badge>
      <h1 className="display-lg mt-4">Hi, {firstName}.</h1>
      <p className="mt-4 max-w-md text-char-soft">
        You are signed in as {user?.email}. Your orders, addresses and profile will appear here in
        a later phase.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        {isAdmin ? <LinkButton to="/admin">Open admin</LinkButton> : null}
        <LinkButton to="/shop" variant="outline">
          Browse the shop
        </LinkButton>
        <Button variant="ghost" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </section>
  )
}
