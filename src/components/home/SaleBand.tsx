import { LinkButton } from '@/components/ui/Button'
import { ArrowIcon } from '@/components/ui/icons'
import { Starburst } from '@/components/graphics/shapes'
import { isSaleLive } from '@/domain/settings'
import { useSettings } from '@/features/settings/SettingsProvider'

export function SaleBand() {
  const { settings } = useSettings()
  if (!isSaleLive(settings)) return null
  return (
    <section className="relative overflow-hidden border-b-2 border-char bg-orange" aria-label="Sale">
      <Starburst outline className="absolute -left-6 -top-6 hidden size-32 animate-spin-slow text-lime sm:block" />
      <Starburst outline className="absolute -bottom-8 right-10 hidden size-28 animate-spin-slow text-lavender md:block" />
      <div className="container-page relative flex flex-col items-start gap-5 py-10 sm:items-center sm:py-14 sm:text-center">
        <p className="eyebrow rounded-full border-2 border-char bg-white px-3 py-1">Sale on now</p>
        <h2 className="display-lg max-w-3xl">{settings.saleTitle}</h2>
        {settings.saleText ? <p className="max-w-xl text-lg font-semibold">{settings.saleText}</p> : null}
        {settings.saleEndsOn ? (
          <p className="text-sm font-bold">Ends {new Date(`${settings.saleEndsOn}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</p>
        ) : null}
        <LinkButton to="/shop?sale=1" variant="dark" size="lg">
          Shop the sale
          <ArrowIcon className="size-5" />
        </LinkButton>
      </div>
    </section>
  )
}
