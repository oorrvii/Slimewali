import { LinkButton } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function PlaceholderPage({ title, phase }: { title: string; phase: string }) {
  return (
    <section className="container-page py-24">
      <Badge tone="lavender">{phase}</Badge>
      <h1 className="display-lg mt-4">{title}</h1>
      <p className="mt-4 max-w-md text-char-soft">
        This page is not built yet. It will be added in {phase.toLowerCase()}.
      </p>
      <LinkButton to="/" className="mt-8" variant="outline">
        Back to home
      </LinkButton>
    </section>
  )
}
