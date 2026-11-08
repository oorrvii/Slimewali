import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { requireServices } from './firebase'
import { SlugTakenError } from './errors'
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  type Product,
  type ProductInput,
  type ProductStatus,
  type Variant,
} from '@/domain/catalogue'

const LIST_LIMIT = 100

function toVariant(raw: DocumentData): Variant {
  return {
    id: String(raw.id ?? ''),
    label: String(raw.label ?? ''),
    sku: String(raw.sku ?? ''),
    pricePaise: Number.isInteger(raw.pricePaise) ? raw.pricePaise : 0,
    compareAtPaise: Number.isInteger(raw.compareAtPaise) ? raw.compareAtPaise : null,
    stockQuantity: Number.isInteger(raw.stockQuantity) ? raw.stockQuantity : 0,
    isActive: raw.isActive !== false,
  }
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function millis(value: unknown): number {
  const candidate = value as { toMillis?: () => number } | null
  return candidate && typeof candidate.toMillis === 'function' ? candidate.toMillis() : 0
}

function toProduct(id: string, data: DocumentData): Product {
  const status: ProductStatus =
    data.status === 'published' || data.status === 'archived' ? data.status : 'draft'
  return {
    id,
    name: String(data.name ?? ''),
    slug: String(data.slug ?? ''),
    shortDescription: String(data.shortDescription ?? ''),
    description: String(data.description ?? ''),
    categoryId: String(data.categoryId ?? ''),
    categoryNameSnapshot: String(data.categoryNameSnapshot ?? ''),
    imagePaths: strings(data.imagePaths),
    coverImagePath: typeof data.coverImagePath === 'string' ? data.coverImagePath : null,
    altTexts: strings(data.altTexts),
    pricePaise: Number.isInteger(data.pricePaise) ? data.pricePaise : 0,
    compareAtPricePaise: Number.isInteger(data.compareAtPricePaise) ? data.compareAtPricePaise : null,
    hasVariants: data.hasVariants === true,
    variants: Array.isArray(data.variants) ? data.variants.map(toVariant) : [],
    stockQuantity: Number.isInteger(data.stockQuantity) ? data.stockQuantity : 0,
    lowStockThreshold: Number.isInteger(data.lowStockThreshold)
      ? data.lowStockThreshold
      : DEFAULT_LOW_STOCK_THRESHOLD,
    status,
    isFeatured: data.isFeatured === true,
    sortOrder: Number.isInteger(data.sortOrder) ? data.sortOrder : 0,
    tags: strings(data.tags),
    careInstructions: String(data.careInstructions ?? ''),
    seoTitle: String(data.seoTitle ?? ''),
    seoDescription: String(data.seoDescription ?? ''),
    createdAtMs: millis(data.createdAt),
    updatedAtMs: millis(data.updatedAt),
  }
}

export async function listPublishedProducts(): Promise<Product[]> {
  const { db } = requireServices()
  const snapshot = await getDocs(
    query(collection(db, 'products'), where('status', '==', 'published'), limit(LIST_LIMIT)),
  )
  return snapshot.docs.map((item) => toProduct(item.id, item.data()))
}

export async function listPublishedByCategory(categoryId: string): Promise<Product[]> {
  const { db } = requireServices()
  const snapshot = await getDocs(
    query(
      collection(db, 'products'),
      where('status', '==', 'published'),
      where('categoryId', '==', categoryId),
      limit(LIST_LIMIT),
    ),
  )
  return snapshot.docs.map((item) => toProduct(item.id, item.data()))
}

export async function listFeaturedProducts(count = 8): Promise<Product[]> {
  const { db } = requireServices()
  const snapshot = await getDocs(
    query(
      collection(db, 'products'),
      where('status', '==', 'published'),
      where('isFeatured', '==', true),
      limit(count),
    ),
  )
  return snapshot.docs.map((item) => toProduct(item.id, item.data()))
}

export async function getPublishedProductBySlug(slug: string): Promise<Product | null> {
  const { db } = requireServices()
  const snapshot = await getDocs(
    query(
      collection(db, 'products'),
      where('slug', '==', slug),
      where('status', '==', 'published'),
      limit(1),
    ),
  )
  const first = snapshot.docs[0]
  return first ? toProduct(first.id, first.data()) : null
}

export async function listProductsAdmin(): Promise<Product[]> {
  const { db } = requireServices()
  const snapshot = await getDocs(
    query(collection(db, 'products'), orderBy('updatedAt', 'desc'), limit(300)),
  )
  return snapshot.docs.map((item) => toProduct(item.id, item.data()))
}

export async function getProductAdmin(id: string): Promise<Product | null> {
  const { db } = requireServices()
  const snapshot = await getDoc(doc(db, 'products', id))
  return snapshot.exists() ? toProduct(snapshot.id, snapshot.data()) : null
}

export function newProductId(): string {
  const { db } = requireServices()
  return doc(collection(db, 'products')).id
}

export async function saveProduct(
  input: ProductInput,
  target: { id: string; previousSlug: string | null },
  actorUid: string,
): Promise<void> {
  const { db } = requireServices()
  const productRef = doc(db, 'products', target.id)
  const slugRef = doc(db, 'slugIndex', `product_${input.slug}`)
  const isCreate = target.previousSlug === null

  await runTransaction(db, async (transaction) => {
    const slugSnapshot = await transaction.get(slugRef)
    if (slugSnapshot.exists() && slugSnapshot.data().refId !== target.id) {
      throw new SlugTakenError()
    }

    if (target.previousSlug !== null && target.previousSlug !== input.slug) {
      transaction.delete(doc(db, 'slugIndex', `product_${target.previousSlug}`))
    }
    transaction.set(slugRef, { kind: 'product', refId: target.id })

    transaction.set(
      productRef,
      {
        name: input.name.trim(),
        slug: input.slug,
        shortDescription: input.shortDescription.trim(),
        description: input.description.trim(),
        categoryId: input.categoryId,
        categoryNameSnapshot: input.categoryNameSnapshot,
        imagePaths: input.imagePaths,
        coverImagePath: input.coverImagePath,
        altTexts: input.imagePaths.map((_, index) => input.altTexts[index] ?? ''),
        pricePaise: input.hasVariants ? 0 : input.pricePaise,
        compareAtPricePaise: input.hasVariants ? deleteField() : (input.compareAtPricePaise ?? deleteField()),
        hasVariants: input.hasVariants,
        variants: input.hasVariants
          ? input.variants.map((variant) => ({
              id: variant.id,
              label: variant.label.trim(),
              sku: variant.sku.trim(),
              pricePaise: variant.pricePaise,
              compareAtPaise: variant.compareAtPaise,
              stockQuantity: variant.stockQuantity,
              isActive: variant.isActive,
            }))
          : [],
        stockQuantity: input.hasVariants ? 0 : input.stockQuantity,
        lowStockThreshold: input.lowStockThreshold,
        status: input.status,
        isFeatured: input.isFeatured,
        sortOrder: input.sortOrder,
        tags: input.tags,
        careInstructions: input.careInstructions.trim(),
        seoTitle: input.seoTitle.trim(),
        seoDescription: input.seoDescription.trim(),
        updatedAt: serverTimestamp(),
        updatedBy: actorUid,
        ...(isCreate ? { createdAt: serverTimestamp(), createdBy: actorUid } : {}),
      },
      { merge: true },
    )
  })
}

export async function setProductStatus(
  id: string,
  status: ProductStatus,
  actorUid: string,
): Promise<void> {
  const { db } = requireServices()
  await updateDoc(doc(db, 'products', id), {
    status,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
  })
}

export async function duplicateProduct(source: Product, actorUid: string): Promise<string> {
  const { db } = requireServices()
  const id = newProductId()
  let slug = `${source.slug}-copy`.slice(0, 60).replace(/-+$/, '')

  for (let attempt = 2; attempt < 50; attempt += 1) {
    const existing = await getDoc(doc(db, 'slugIndex', `product_${slug}`))
    if (!existing.exists()) break
    slug = `${source.slug}-copy-${attempt}`.slice(0, 60).replace(/-+$/, '')
  }

  await saveProduct(
    {
      name: `${source.name} (copy)`.slice(0, 120),
      slug,
      shortDescription: source.shortDescription,
      description: source.description,
      categoryId: source.categoryId,
      categoryNameSnapshot: source.categoryNameSnapshot,
      imagePaths: [],
      coverImagePath: null,
      altTexts: [],
      pricePaise: source.pricePaise,
      compareAtPricePaise: source.compareAtPricePaise,
      hasVariants: source.hasVariants,
      variants: source.variants.map((variant) => ({ ...variant, id: crypto.randomUUID(), sku: '' })),
      stockQuantity: source.stockQuantity,
      lowStockThreshold: source.lowStockThreshold,
      status: 'draft',
      isFeatured: false,
      sortOrder: source.sortOrder,
      tags: source.tags,
      careInstructions: source.careInstructions,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
    },
    { id, previousSlug: null },
    actorUid,
  )
  return id
}

export async function getPublishedProductsByIds(ids: string[]): Promise<Map<string, Product | null>> {
  const { db } = requireServices()
  const unique = Array.from(new Set(ids))
  const entries = await Promise.all(
    unique.map(async (id): Promise<[string, Product | null]> => {
      try {
        const snapshot = await getDoc(doc(db, 'products', id))
        if (!snapshot.exists()) return [id, null]
        const product = toProduct(snapshot.id, snapshot.data())
        return [id, product.status === 'published' ? product : null]
      } catch {
        return [id, null]
      }
    }),
  )
  return new Map(entries)
}
