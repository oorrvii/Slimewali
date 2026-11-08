import { Link } from 'react-router-dom'
import { Hero } from '@/components/home/Hero'
import { SaleBand } from '@/components/home/SaleBand'
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductGrid'
import { Card } from '@/components/ui/Card'
import { LinkButton } from '@/components/ui/Button'
import { ArrowIcon } from '@/components/ui/icons'
import { Asterisk, Starburst } from '@/components/graphics/shapes'
import { imageUrl } from '@/data/media'
import { listFeaturedProducts } from '@/data/products'
import { altTextFor, coverPathOf } from '@/domain/catalogue'
import { useActiveCategories } from '@/features/catalogue/useActiveCategories'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useSettings } from '@/features/settings/SettingsProvider'
import { useReveal } from '@/hooks/useReveal'

const trust = [
  { title: 'Handmade', body: 'Made by hand in small batches.' },
  { title: 'India-wide shipping', body: 'We confirm delivery to your PIN code.' },
  {
    title: 'Prepaid only',
    body: 'Cash on Delivery is not available. We review your order request, then share payment details with you directly.',
  },
]

export function HomePage() {
  usePageTitle(undefined, 'Handmade slime, shipped across India.')
  const { settings } = useSettings()
  const featured = useAsync(() => listFeaturedProducts(8), [])
  const { categories } = useActiveCategories()
  const productsRef = useReveal<HTMLDivElement>()
  const trustRef = useReveal<HTMLDivElement>()

  const homeCategories = categories.filter((category) => category.showOnHome)
  const featuredList = [...(featured.data ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder || b.createdAtMs - a.createdAtMs,
  )
  const heroProduct = featuredList.find((product) => coverPathOf(product))
  const heroCover = heroProduct ? coverPathOf(heroProduct) : null

  return (
    <>
      <Hero
        imageUrl={heroCover ? imageUrl(heroCover) : undefined}
        imageAlt={heroProduct && heroCover ? altTextFor(heroProduct, heroCover) : undefined}
      />

      <SaleBand />

      {homeCategories.length > 0 ? (
        <section className="container-page py-16 sm:py-20" aria-labelledby="home-categories">
          <h2 id="home-categories" className="display-lg">
            Pick a texture
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {homeCategories.map((category) => {
              const dark = category.accentColor === '#343A35'
              return (
                <li key={category.id}>
                  <Link
                    to={`/category/${category.slug}`}
                    style={{ backgroundColor: category.accentColor }}
                    className={`group relative flex aspect-square flex-col justify-between overflow-hidden rounded-[1.25rem] border-2 border-char p-4 shadow-pop-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-pop focus-visible:-translate-y-1 ${
                      dark ? 'text-cream' : 'text-char'
                    }`}
                  >
                    {category.imagePath ? (
                      <img
                        src={imageUrl(category.imagePath, 'small')}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 size-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : null}
                    <span className="relative self-start rounded-lg border-2 border-char bg-white px-2.5 py-1 font-display text-lg font-extrabold leading-tight text-char shadow-pop-sm">
                      {category.name}
                    </span>
                    <ArrowIcon className="relative size-7 self-end rounded-full border-2 border-char bg-white p-1 text-char" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {featured.loading || featuredList.length > 0 ? (
        <section className="container-page pb-16 sm:pb-20" aria-labelledby="home-featured">
          <div className="flex items-end justify-between gap-4">
            <h2 id="home-featured" className="display-lg">
              Featured slimes
            </h2>
            <div className="hidden sm:block">
              <LinkButton to="/shop" variant="outline" size="sm">
                View all
              </LinkButton>
            </div>
          </div>
          <div ref={productsRef} className="reveal mt-8">
            {featured.loading ? <ProductGridSkeleton count={4} /> : <ProductGrid products={featuredList} />}
          </div>
          <div className="mt-8 flex justify-center sm:hidden">
            <LinkButton to="/shop" variant="outline">
              View all
            </LinkButton>
          </div>
        </section>
      ) : null}

      <section className="border-y-2 border-char bg-lavender">
        <div className="container-page relative grid gap-8 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <Starburst outline className="absolute right-6 top-6 hidden size-28 animate-spin-slow text-lime lg:block" />
          <h2 className="display-lg">{settings.textureTitle}</h2>
          <div>
            <p className="max-w-md text-lg">{settings.textureBody}</p>
            <div className="mt-6">
              <LinkButton to="/shop" variant="dark">
                Shop all slimes
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <div ref={trustRef} className="reveal grid gap-4 md:grid-cols-3">
          {trust.map((item, index) => (
            <Card key={item.title} tone={index === 2 ? 'lime' : 'white'} pop>
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
