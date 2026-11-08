import { InfoPage } from './InfoPage'
import { useSettings } from '@/features/settings/SettingsProvider'
import { whatsappLink } from '@/domain/settings'

export function ContactPage() {
  const { settings } = useSettings()
  const rows: { label: string; value: string; href: string }[] = []
  if (settings.supportEmail) rows.push({ label: 'Email', value: settings.supportEmail, href: `mailto:${settings.supportEmail}` })
  const wa = whatsappLink(settings.whatsappNumber)
  if (wa) rows.push({ label: 'WhatsApp', value: settings.whatsappNumber, href: wa })
  if (settings.supportPhone) {
    rows.push({ label: 'Phone', value: settings.supportPhone, href: `tel:${settings.supportPhone.replace(/[^\d+]/g, '')}` })
  }
  if (settings.instagramHandle) {
    rows.push({
      label: 'Instagram',
      value: `@${settings.instagramHandle}`,
      href: `https://instagram.com/${settings.instagramHandle}`,
    })
  }
  return (
    <InfoPage
      pageId="contact"
      extra={() =>
        rows.length > 0 ? (
          <ul className="mt-8 space-y-3">
            {rows.map((row) => (
              <li key={row.label} className="rounded-[1.25rem] border-2 border-char bg-white p-5">
                <p className="eyebrow">{row.label}</p>
                <a href={row.href} className="mt-1 inline-block break-all font-display text-xl font-bold underline underline-offset-4">
                  {row.value}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-char-soft">Contact details have not been added yet.</p>
        )
      }
    />
  )
}
