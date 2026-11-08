import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { ProductCard } from '@/components/product/ProductCard'
import { listAllCategories, saveCategory, newCategoryId } from '@/data/categories'
import { SlugTakenError } from '@/data/errors'
import { deleteStoredImages } from '@/data/media'
import { getProductAdmin, newProductId, saveProduct } from '@/data/products'
import {
  emptyCategoryInput,
  emptyProductInput,
  type Category,
  type Product,
  type ProductInput,
  type ProductStatus,
} from '@/domain/catalogue'
import { paiseToInput, parseRupeesToPaise } from '@/domain/money'
import { slugify } from '@/domain/slug'
import { validateForPublish, validateProduct, type FieldErrors } from '@/domain/validators'
import { ImageManager } from '@/features/admin/ImageManager'
import { VariantEditor } from '@/features/admin/VariantEditor'
import { LoadError, LoadingBlock, PageHeader } from '@/features/admin/AdminParts'
import { toCardData } from '@/features/catalogue/cardData'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useUnsavedWarning } from '@/hooks/useUnsavedWarning'

function toInput(product: Product): ProductInput {
  return {
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    categoryId: product.categoryId,
    categoryNameSnapshot: product.categoryNameSnapshot,
    imagePaths: product.imagePaths,
    coverImagePath: product.coverImagePath,
    altTexts: product.imagePaths.map((_, index) => product.altTexts[index] ?? ''),
    pricePaise: product.pricePaise,
    compareAtPricePaise: product.compareAtPricePaise,
    hasVariants: product.hasVariants,
    variants: product.variants,
    stockQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold,
    status: product.status,
    isFeatured: product.isFeatured,
    sortOrder: product.sortOrder,
    tags: product.tags,
    careInstructions: product.careInstructions,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
  }
}

function parseTags(text: string): string[] {
  const seen = new Set<string>()
  for (const piece of text.split(',')) {
    const tag = piece.trim().slice(0, 30)
    if (tag) seen.add(tag)
  }
  return [...seen]
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.25rem] border-2 border-char bg-white p-5 sm:p-6">
      <h2 className="display-md">{title}</h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  )
}

function ProductForm({
  productId,
  existing,
  categories,
  reloadCategories,
  savedNotice,
}: {
  productId: string
  existing: Product | null
  categories: Category[]
  reloadCategories: () => void
  savedNotice: boolean
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const actorUid = user?.uid ?? ''
  const [form, setForm] = useState<ProductInput>(existing ? toInput(existing) : emptyProductInput())
  const [priceText, setPriceText] = useState(existing ? paiseToInput(existing.pricePaise) : '')
  const [compareText, setCompareText] = useState(
    existing?.compareAtPricePaise ? paiseToInput(existing.compareAtPricePaise) : '',
  )
  const [tagsText, setTagsText] = useState(existing ? existing.tags.join(', ') : '')
  const [slugEdited, setSlugEdited] = useState(existing !== null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [quickName, setQuickName] = useState('')
  const [quickError, setQuickError] = useState<string | null>(null)
  const [quickBusy, setQuickBusy] = useState(false)
  const sessionUploads = useRef<Set<string>>(new Set())
  const pendingDeletes = useRef<Set<string>>(new Set())

  useUnsavedWarning(dirty)

  function patch(next: Partial<ProductInput>) {
    setForm((current) => ({ ...current, ...next }))
    setDirty(true)
  }

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.isActive || category.id === form.categoryId),
    [categories, form.categoryId],
  )

  const previewProduct = useMemo(() => {
    const priced = parseRupeesToPaise(priceText)
    return {
      id: productId,
      ...form,
      pricePaise: priced ?? 0,
      tags: parseTags(tagsText),
    }
  }, [form, priceText, tagsText, productId])

  async function quickCreateCategory() {
    const name = quickName.trim()
    const slug = slugify(name)
    if (!name || !slug) {
      setQuickError('Enter a category name.')
      return
    }
    setQuickBusy(true)
    setQuickError(null)
    try {
      const id = newCategoryId()
      await saveCategory(
        { ...emptyCategoryInput(), name, slug },
        { id, previousSlug: null },
        actorUid,
      )
      reloadCategories()
      patch({ categoryId: id, categoryNameSnapshot: name })
      setQuickName('')
    } catch (caught) {
      setQuickError(
        caught instanceof SlugTakenError
          ? 'A category with a similar name already exists.'
          : 'We could not create the category. Try again.',
      )
    } finally {
      setQuickBusy(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const priced = parseRupeesToPaise(priceText)
    const compare = compareText.trim() === '' ? null : parseRupeesToPaise(compareText)
    const candidate: ProductInput = {
      ...form,
      pricePaise: form.hasVariants ? 0 : (priced ?? 0),
      compareAtPricePaise: form.hasVariants ? null : compare,
      tags: parseTags(tagsText),
    }

    const found =
      candidate.status === 'published' ? validateForPublish(candidate) : validateProduct(candidate)
    if (!form.hasVariants && priceText.trim() !== '' && priced === null) {
      found.pricePaise = 'Enter a price like 299 or 299.50.'
    }
    if (compareText.trim() !== '' && compare === null) {
      found.compareAtPricePaise = 'Enter a price like 399 or 399.50.'
    }
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setFormError('Some fields need attention. They are marked below.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSaving(true)
    try {
      await saveProduct(
        candidate,
        { id: productId, previousSlug: existing ? existing.slug : null },
        actorUid,
      )
      const removed = [...pendingDeletes.current]
      if (removed.length > 0) await deleteStoredImages(removed).catch(() => undefined)
      pendingDeletes.current.clear()
      sessionUploads.current.clear()
      setDirty(false)
      navigate(`/admin/products/${productId}`, { replace: true, state: { saved: Date.now() } })
    } catch (caught) {
      if (caught instanceof SlugTakenError) {
        setErrors({ slug: 'Another product already uses this slug.' })
        setFormError('Some fields need attention. They are marked below.')
      } else {
        setFormError(
          'We could not save this product. Check your connection and try again. Publishing needs a category, a price and at least one image.',
        )
      }
    } finally {
      setSaving(false)
    }
  }

  const isNew = existing === null

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader
        title={isNew ? 'New product' : form.name || 'Edit product'}
        subtitle={
          isNew
            ? 'Fill in the details, add photos, then save as a draft or publish.'
            : 'Changes appear on the shop as soon as you save a published product.'
        }
        action={
          <Link to="/admin/products" className="font-bold underline underline-offset-4">
            Back to products
          </Link>
        }
      />

      <div className="mb-6 space-y-3" aria-live="polite">
        {savedNotice ? <Notice tone="success">Product saved.</Notice> : null}
        {formError ? <Notice tone="error">{formError}</Notice> : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Section title="Basics">
            <Input
              label="Name"
              value={form.name}
              maxLength={120}
              error={errors.name}
              onChange={(event) => {
                const name = event.target.value
                patch(slugEdited ? { name } : { name, slug: slugify(name) })
              }}
            />
            <Input
              label="Slug"
              hint="Used in the web address: /product/your-slug"
              value={form.slug}
              maxLength={60}
              error={errors.slug}
              onChange={(event) => {
                setSlugEdited(true)
                patch({ slug: event.target.value })
              }}
            />
            <Select
              label="Category"
              value={form.categoryId}
              error={errors.categoryId}
              onChange={(event) => {
                const chosen = categories.find((category) => category.id === event.target.value)
                patch({ categoryId: event.target.value, categoryNameSnapshot: chosen?.name ?? '' })
              }}
            >
              <option value="">Choose a category</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.isActive ? '' : ' (inactive)'}
                </option>
              ))}
            </Select>
            <div className="rounded-xl border-2 border-dashed border-char p-3">
              <p className="text-sm font-bold">Need a new category?</p>
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <div className="min-w-48 flex-1">
                  <Input
                    label="New category name"
                    value={quickName}
                    maxLength={60}
                    error={quickError ?? undefined}
                    onChange={(event) => setQuickName(event.target.value)}
                  />
                </div>
                <Button variant="outline" loading={quickBusy} onClick={() => void quickCreateCategory()}>
                  Create and select
                </Button>
              </div>
            </div>
            <Input
              label="Short description"
              hint="One line shown on product cards."
              value={form.shortDescription}
              maxLength={200}
              error={errors.shortDescription}
              onChange={(event) => patch({ shortDescription: event.target.value })}
            />
            <Textarea
              label="Description"
              rows={7}
              value={form.description}
              maxLength={5000}
              error={errors.description}
              hint="Write only what is true about this product."
              onChange={(event) => patch({ description: event.target.value })}
            />
            <Input
              label="Tags"
              hint="Texture words separated by commas, for example: crunchy, glossy"
              value={tagsText}
              error={errors.tags}
              onChange={(event) => {
                setTagsText(event.target.value)
                setDirty(true)
              }}
            />
          </Section>

          <Section title="Photos">
            <ImageManager
              productId={productId}
              value={{ paths: form.imagePaths, alts: form.altTexts, cover: form.coverImagePath }}
              sessionUploads={sessionUploads}
              onRemovePersisted={(path) => pendingDeletes.current.add(path)}
              error={errors.images}
              onChange={(next) =>
                patch({ imagePaths: next.paths, altTexts: next.alts, coverImagePath: next.cover })
              }
            />
          </Section>

          <Section title="Price and stock">
            <Toggle
              label="This product has variants"
              hint="Use variants for different sizes or jar quantities, each with its own price and stock."
              checked={form.hasVariants}
              onChange={(event) => patch({ hasVariants: event.target.checked })}
            />
            {form.hasVariants ? (
              <VariantEditor
                variants={form.variants}
                errors={errors}
                onChange={(variants) => patch({ variants })}
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Price (₹)"
                  inputMode="decimal"
                  value={priceText}
                  error={errors.pricePaise}
                  onChange={(event) => {
                    setPriceText(event.target.value)
                    setDirty(true)
                  }}
                />
                <Input
                  label="Stock quantity"
                  inputMode="numeric"
                  value={String(form.stockQuantity)}
                  error={errors.stockQuantity}
                  onChange={(event) => {
                    const parsed = Number(event.target.value.replace(/\D/g, ''))
                    patch({ stockQuantity: Number.isFinite(parsed) ? parsed : 0 })
                  }}
                />
              </div>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              {form.hasVariants ? null : (
              <Input
                label="Original price (₹), optional"
                hint="Fill this to show a discount. Use the earlier price you really charged."
                inputMode="decimal"
                value={compareText}
                error={errors.compareAtPricePaise}
                onChange={(event) => {
                  setCompareText(event.target.value)
                  setDirty(true)
                }}
              />
              )}
              <Input
                label="Low-stock alert at"
                hint="Show a low-stock label at or below this number."
                inputMode="numeric"
                value={String(form.lowStockThreshold)}
                error={errors.lowStockThreshold}
                onChange={(event) => {
                  const parsed = Number(event.target.value.replace(/\D/g, ''))
                  patch({ lowStockThreshold: Number.isFinite(parsed) ? parsed : 0 })
                }}
              />
            </div>
          </Section>

          <Section title="Care and search">
            <Textarea
              label="Care and storage instructions"
              hint="Shown on the product page. Add only instructions you are sure about."
              rows={4}
              value={form.careInstructions}
              maxLength={2000}
              error={errors.careInstructions}
              onChange={(event) => patch({ careInstructions: event.target.value })}
            />
            <Input
              label="SEO title"
              value={form.seoTitle}
              maxLength={70}
              error={errors.seoTitle}
              onChange={(event) => patch({ seoTitle: event.target.value })}
            />
            <Textarea
              label="SEO description"
              rows={2}
              value={form.seoDescription}
              maxLength={160}
              error={errors.seoDescription}
              onChange={(event) => patch({ seoDescription: event.target.value })}
            />
          </Section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Section title="Publish">
            <Select
              label="Status"
              value={form.status}
              onChange={(event) => patch({ status: event.target.value as ProductStatus })}
            >
              <option value="draft">Draft, hidden from the shop</option>
              <option value="published">Published, visible to customers</option>
              <option value="archived">Archived, hidden from the shop</option>
            </Select>
            <Toggle
              label="Feature on the home page"
              checked={form.isFeatured}
              onChange={(event) => patch({ isFeatured: event.target.checked })}
            />
            <Input
              label="Sort order"
              hint="Lower numbers appear first."
              inputMode="numeric"
              value={String(form.sortOrder)}
              error={errors.sortOrder}
              onChange={(event) => {
                const parsed = Number(event.target.value)
                patch({ sortOrder: Number.isFinite(parsed) ? Math.trunc(parsed) : 0 })
              }}
            />
            <Button type="submit" fullWidth loading={saving}>
              {form.status === 'published' ? 'Save and publish' : 'Save'}
            </Button>
            {existing && existing.status === 'published' ? (
              <Link
                to={`/product/${existing.slug}`}
                className="block text-center text-sm font-bold underline underline-offset-4"
              >
                View on the shop
              </Link>
            ) : null}
          </Section>

          <section aria-label="Card preview" className="rounded-[1.25rem] border-2 border-char bg-cream p-5">
            <h2 className="eyebrow">Card preview</h2>
            <div className="mx-auto mt-4 max-w-64">
              <ProductCard product={toCardData(previewProduct)} preview />
            </div>
          </section>
        </aside>
      </div>
    </form>
  )
}

export function AdminProductEditPage() {
  const { id } = useParams()
  const location = useLocation()
  const savedToken = (location.state as { saved?: number } | null)?.saved ?? 0
  const isNew = id === undefined
  usePageTitle(isNew ? 'New product · Admin' : 'Edit product · Admin')

  const categories = useAsync(listAllCategories, [])
  const existing = useAsync(
    () => (id ? getProductAdmin(id) : Promise.resolve(null)),
    [id, savedToken],
  )
  const newId = useRef<string | null>(null)
  if (isNew && newId.current === null) newId.current = newProductId()

  if ((categories.loading && categories.data === null) || existing.loading) {
    return <LoadingBlock label="Loading product" />
  }
  if (categories.error) return <LoadError what="categories" onRetry={categories.reload} />
  if (existing.error) return <LoadError what="this product" onRetry={existing.reload} />

  if (!isNew && existing.data === null) {
    return (
      <Notice tone="error" action={<Link to="/admin/products" className="underline">Back to products</Link>}>
        This product could not be found.
      </Notice>
    )
  }

  const productId = isNew ? (newId.current as string) : (id as string)

  return (
    <ProductForm
      key={`${productId}-${savedToken}`}
      productId={productId}
      existing={existing.data}
      categories={categories.data ?? []}
      reloadCategories={categories.reload}
      savedNotice={savedToken > 0}
    />
  )
}
