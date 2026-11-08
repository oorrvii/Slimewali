import { useParams } from 'react-router-dom'
import { Button, LinkButton } from '@/components/ui/Button'
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductGrid'
import { StoreMessage } from '@/components/product/StoreMessage'
import { getActiveCategoryBySlug } from '@/data/categories'
import { imageUrl } from '@/data/media'
import { listPublishedByCategory } from '@/data/products'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

export function CategoryPage() {
  const { slug = '' } = useParams()
  const category = useAsync(() => getActiveCategoryBySlug(slug), [slug])
  const categoryId = category.data?.id ?? ''
  const products = useAsync(
    () => (categoryId ? listPublishedByCategory(categoryId) : Promise.resolve([])),
    [categoryId],
  )

  usePageTitle(category.data?.name ?? 'Category', category.data?.description || undefined)

  if (category.loading) {
    return (
      <section className="container-page py-14">
        <ProductGridSkeleton count={4} />
      </section>
    )
  }

  if (category.error) {
    return (
      <section className="container-page py-14">
        <StoreMessage
          title="We could not load this category"
          body="Please check your connection and try again."
          action={<Button onClick={category.reload}>Try again</Button>}
        />
      </section>
    )
  }

  if (!category.data) {
    return (
      <section className="container-page py-14">
        <StoreMessage
          title="We could not find that category"
          body="It may have been renamed or removed."
          action={<LinkButton to="/shop">Browse all slimes</LinkButton>}
        />
      </section>
    )
  }

  const list = [...(products.data ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder || b.createdAtMs - a.createdAtMs,
  )
  const dark = category.data.accentColor === '#343A35'

  return (
    <>
      <section
        style={{ backgroundColor: category.data.accentColor }}
        className={`border-b-2 border-char ${dark ? 'text-cream' : 'text-char'}`}
      >
        <div className="container-page grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="eyebrow">Category</p>
            <h1 className="display-lg mt-2">{category.data.name}</h1>
            {category.data.description ? (
              <p className="mt-5 max-w-xl text-lg">{category.data.description}</p>
            ) : null}
          </div>
          {category.data.imagePath ? (
            <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[1.25rem] border-2 border-char bg-white shadow-pop">
              <img
                src={imageUrl(category.data.imagePath)}
                alt=""
                className="aspect-[4/3] size-full object-cover"
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="container-page py-12">
        {products.loading ? <ProductGridSkeleton count={4} /> : null}
        {products.error ? (
          <StoreMessage
            title="We could not load these products"
            body="Please check your connection and try again."
            action={<Button onClick={products.reload}>Try again</Button>}
          />
        ) : null}
        {!products.loading && !products.error && list.length === 0 ? (
          <StoreMessage
            title="Nothing here yet"
            body="New slimes for this category are on their way."
            action={<LinkButton to="/shop">Browse all slimes</LinkButton>}
          />
        ) : null}
        {list.length > 0 ? <ProductGrid products={list} /> : null}
      </section>
    </>
  )
}
