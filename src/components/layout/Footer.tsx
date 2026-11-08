import { Link } from 'react-router-dom'
import { Squiggle } from '@/components/graphics/shapes'
import { useSettings } from '@/features/settings/SettingsProvider'
import { whatsappLink } from '@/domain/settings'

const shopLinks = [
  { to: '/shop', label: 'Shop all' },
  { to: '/cart', label: 'Cart' },
  { to: '/account/orders', label: 'My orders' },
]

const helpLinks = [
  { to: '/faq', label: 'FAQ' },
  { to: '/shipping', label: 'Shipping' },
  { to: '/returns', label: 'Returns & refunds' },
  { to: '/contact', label: 'Contact' },
]

const legalLinks = [
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
]

function Column({ title, items }: { title: string; items: { to: string; label: string }[] }) {
  return (
    <div>
      <h2 className="eyebrow text-lime">{title}</h2>
      <ul className="mt-4 space-y-1">
        {items.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="inline-flex min-h-10 items-center text-cream underline-offset-4 hover:text-lime hover:underline"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  const { settings } = useSettings()
  const wa = whatsappLink(settings.whatsappNumber)
  return (
    <footer className="mt-24 bg-char text-cream">
      <div className="container-page py-14">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="" width="64" height="64" className="size-16 rounded-full bg-cream object-contain p-1" />
              <p className="font-display text-4xl font-extrabold uppercase tracking-tight">{settings.storeName}</p>
            </div>
            <Squiggle className="mt-3 h-4 w-24 text-orange" />
            <p className="mt-5 max-w-xs text-cream/80">
              Handmade slime, shipped across India. Orders are reviewed by us first, then we get in
              touch with payment details.
            </p>
          </div>
          <Column title="Shop" items={shopLinks} />
          <Column title="Help" items={helpLinks} />
          <Column title="Legal" items={legalLinks} />
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t-2 border-cream/20 pt-6 text-sm text-cream/70 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            {settings.supportEmail ? (
              <a className="underline underline-offset-4 hover:text-lime" href={`mailto:${settings.supportEmail}`}>
                {settings.supportEmail}
              </a>
            ) : null}
            {wa ? (
              <a className="underline underline-offset-4 hover:text-lime" href={wa}>
                WhatsApp
              </a>
            ) : null}
            {settings.instagramHandle ? (
              <a
                className="underline underline-offset-4 hover:text-lime"
                href={`https://instagram.com/${settings.instagramHandle}`}
              >
                @{settings.instagramHandle}
              </a>
            ) : null}
          </p>
        </div>
      </div>
    </footer>
  )
}
