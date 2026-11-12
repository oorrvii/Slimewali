import { useSettings } from '@/features/settings/SettingsProvider'
import { LinkButton } from '@/components/ui/Button'
import { ArrowIcon } from '@/components/ui/icons'
import { Asterisk, Spark, Squiggle, Sticker } from '@/components/graphics/shapes'

export function Hero() {
  const { settings } = useSettings()
  return (
    <section className="relative overflow-hidden border-b-2 border-char">
      <Spark className="absolute right-6 top-8 size-12 text-orange sm:right-16 sm:top-12 sm:size-16" outline />
      <div className="container-page relative py-10 sm:py-16 lg:py-24">
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
        <p className="mt-8 max-w-md text-lg text-char-soft">{settings.heroSubheading}</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <LinkButton to="/shop" size="lg">
            Shop slimes
            <ArrowIcon className="size-5" />
          </LinkButton>
          <LinkButton to="/about" variant="outline" size="lg">
            Our story
          </LinkButton>
        </div>
        <div className="mt-10 flex flex-wrap gap-3" aria-hidden="true">
          <Sticker tone="lime" rotate={-4}>
            Handmade
          </Sticker>
          <Sticker tone="white" rotate={3}>
            Small batch
          </Sticker>
        </div>
      </div>
    </section>
  )
}