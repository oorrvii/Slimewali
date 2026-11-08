import { Hero } from '@/components/home/Hero'
import { ProductCard } from '@/components/product/ProductCard'
import { Card } from '@/components/ui/Card'
import { LinkButton } from '@/components/ui/Button'
import { Asterisk, Starburst } from '@/components/graphics/shapes'
import { useReveal } from '@/hooks/useReveal'
import { sampleProducts } from '@/preview/sampleData'

const trust = [
  { title: 'Handmade', body: 'Made by hand in small batches.' },
  { title: 'India-wide shipping', body: 'We confirm delivery to your PIN code.' },
  { title: 'Order approval first', body: 'We review your request, then share payment details with you directly.' },
]

export function PreviewHomePage() {
  const productsRef = useReveal<HTMLDivElement>()
  const trustRef = useReveal<HTMLDivElement>()

  return (
    <>
      <Hero />

      <section className="container-page py-16 sm:py-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-lavender-ink">Sample layout</p>
            <h2 className="display-lg mt-2">Featured slimes</h2>
          </div>
          <div className="hidden sm:block">
            <LinkButton to="/shop" variant="outline" size="sm">
              View all
            </LinkButton>
          </div>
        </div>
        <div
          ref={productsRef}
          className="reveal mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4"
        >
          {sampleProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-lavender">
        <div className="container-page relative grid gap-8 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <Starburst outline className="absolute right-6 top-6 hidden size-28 animate-spin-slow text-lime lg:block" />
          <h2 className="display-lg">
            Textures you can almost feel through the screen.
          </h2>
          <p className="max-w-md text-lg">
            This panel is for texture and batch storytelling using real product photography once
            the owner supplies it.
          </p>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <div ref={trustRef} className="reveal grid gap-4 md:grid-cols-3">
          {trust.map((item, index) => (
            <Card key={item.title} tone={index === 1 ? 'lime' : 'white'} pop>
              <Asterisk className="size-6 text-orange-ink" />
              <h3 className="display-md mt-4">{item.title}</h3>
              <p className="mt-2 text-char-soft">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  )
}
