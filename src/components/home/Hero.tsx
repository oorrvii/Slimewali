import { useSettings } from '@/features/settings/SettingsProvider'
import { LinkButton } from '@/components/ui/Button'
import { ArrowIcon } from '@/components/ui/icons'
import { Asterisk, Blob, Ring, Spark, Squiggle, Sticker } from '@/components/graphics/shapes'

export function Hero({ imageUrl, imageAlt }: { imageUrl?: string; imageAlt?: string }) {
  const { settings } = useSettings()
  return (
    <section className="relative overflow-hidden border-b-2 border-char">
      <div className="container-page relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.25fr_1fr] lg:py-24">
        <div className="relative z-10">
          <p className="eyebrow inline-flex items-center gap-2">
            <Asterisk className="size-3 text-orange" />
            {settings.heroEyebrow}
          </p>
          <h1 className="display-xl mt-5">
            {settings.heroLine1}
            <br />
            <span className="relative inline-block">
              {settings.heroLine2}
              <Squiggle className="absolute -bottom-2 left-0 h-4 w-full text-orange" />
            </span>
            <br />
            {settings.heroLine3}
          </h1>
          <p className="mt-8 max-w-md text-lg text-char-soft">
            {settings.heroSubheading}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <LinkButton to="/shop" size="lg">
              Shop slimes
              <ArrowIcon className="size-5" />
            </LinkButton>
            <LinkButton to="/about" variant="outline" size="lg">
              Our story
            </LinkButton>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none" aria-hidden="true">
          <Blob variant={1} outline className="absolute inset-0 size-full animate-drift text-lavender" />
          <Blob variant={3} outline className="absolute -bottom-4 -left-4 size-2/5 animate-drift-slow text-lime" />
          <Spark className="absolute right-2 top-4 size-16 animate-drift text-orange" outline />
          <Ring className="absolute bottom-6 right-6 size-20 animate-spin-slow text-char" />
          {imageUrl ? (
            <div className="absolute inset-[16%] overflow-hidden rounded-[2rem] border-2 border-char bg-cream shadow-pop">
              <img src={imageUrl} alt={imageAlt ?? ''} className="size-full object-cover" />
            </div>
          ) : null}
          <Sticker tone="lime" rotate={-8} className="absolute left-2 top-10">
            Handmade
          </Sticker>
          <Sticker tone="white" rotate={6} className="absolute bottom-16 left-6">
            Small batch
          </Sticker>
        </div>
      </div>
    </section>
  )
}