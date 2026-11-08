export type ProductStatus = 'draft' | 'published' | 'archived'

export const PALETTE_COLORS = [
  { value: '#D5E66D', label: 'Lime' },
  { value: '#A99BEA', label: 'Lavender' },
  { value: '#E98B62', label: 'Orange' },
  { value: '#F2EBDD', label: 'Cream' },
  { value: '#343A35', label: 'Charcoal' },
] as const

export type AccentColor = (typeof PALETTE_COLORS)[number]['value']

export type Category = {
  id: string
  name: string
  slug: string
  description: string
  imagePath: string | null
  accentColor: AccentColor
  sortOrder: number
  isActive: boolean
  showOnHome: boolean
}

export type CategoryInput = Omit<Category, 'id'>

export type Variant = {
  id: string
  label: string
  sku: string
  pricePaise: number
  compareAtPaise: number | null
  stockQuantity: number
  isActive: boolean
}

export type Product = {
  id: string
  name: string
  slug: string
  shortDescription: string
  description: string
  categoryId: string
  categoryNameSnapshot: string
  imagePaths: string[]
  coverImagePath: string | null
  altTexts: string[]
  pricePaise: number
  compareAtPricePaise: number | null
  hasVariants: boolean
  variants: Variant[]
  stockQuantity: number
  lowStockThreshold: number
  status: ProductStatus
  isFeatured: boolean
  sortOrder: number
  tags: string[]
  careInstructions: string
  seoTitle: string
  seoDescription: string
  createdAtMs: number
  updatedAtMs: number
}

export type ProductInput = Omit<Product, 'id' | 'createdAtMs' | 'updatedAtMs'>

export type Availability = 'in_stock' | 'low_stock' | 'out_of_stock'

export const DEFAULT_LOW_STOCK_THRESHOLD = 3

export function activeVariants(product: Pick<Product, 'hasVariants' | 'variants'>): Variant[] {
  return product.hasVariants ? product.variants.filter((variant) => variant.isActive) : []
}

export function totalStock(product: Pick<Product, 'hasVariants' | 'variants' | 'stockQuantity'>): number {
  if (!product.hasVariants) return product.stockQuantity
  return activeVariants(product).reduce((sum, variant) => sum + variant.stockQuantity, 0)
}

export function availabilityOf(
  product: Pick<Product, 'hasVariants' | 'variants' | 'stockQuantity' | 'lowStockThreshold'>,
): Availability {
  const stock = totalStock(product)
  if (stock <= 0) return 'out_of_stock'
  if (stock <= product.lowStockThreshold) return 'low_stock'
  return 'in_stock'
}

export function priceRange(product: Pick<Product, 'hasVariants' | 'variants' | 'pricePaise'>): {
  minPaise: number
  maxPaise: number
} {
  const variants = activeVariants(product)
  if (variants.length === 0) return { minPaise: product.pricePaise, maxPaise: product.pricePaise }
  const prices = variants.map((variant) => variant.pricePaise)
  return { minPaise: Math.min(...prices), maxPaise: Math.max(...prices) }
}

export function coverPathOf(product: Pick<Product, 'coverImagePath' | 'imagePaths'>): string | null {
  if (product.coverImagePath && product.imagePaths.includes(product.coverImagePath)) {
    return product.coverImagePath
  }
  return product.imagePaths[0] ?? null
}

export function altTextFor(product: Pick<Product, 'imagePaths' | 'altTexts' | 'name'>, path: string): string {
  const index = product.imagePaths.indexOf(path)
  const alt = index >= 0 ? product.altTexts[index] : ''
  return alt && alt.trim().length > 0 ? alt : product.name
}

export function emptyProductInput(): ProductInput {
  return {
    name: '',
    slug: '',
    shortDescription: '',
    description: '',
    categoryId: '',
    categoryNameSnapshot: '',
    imagePaths: [],
    coverImagePath: null,
    altTexts: [],
    pricePaise: 0,
    compareAtPricePaise: null,
    hasVariants: false,
    variants: [],
    stockQuantity: 0,
    lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
    status: 'draft',
    isFeatured: false,
    sortOrder: 0,
    tags: [],
    careInstructions: '',
    seoTitle: '',
    seoDescription: '',
  }
}

export function emptyCategoryInput(): CategoryInput {
  return {
    name: '',
    slug: '',
    description: '',
    imagePath: null,
    accentColor: '#D5E66D',
    sortOrder: 0,
    isActive: true,
    showOnHome: true,
  }
}

export function discountPercent(pricePaise: number, compareAtPaise: number | null | undefined): number | null {
  if (compareAtPaise === null || compareAtPaise === undefined) return null
  if (!(compareAtPaise > pricePaise) || pricePaise <= 0) return null
  const percent = Math.floor(((compareAtPaise - pricePaise) / compareAtPaise) * 100)
  return percent >= 1 ? percent : null
}

export type SaleInfo = {
  onSale: boolean
  maxPercent: number
  lowestPricePaise: number
  lowestCompareAtPaise: number | null
  mixed: boolean
}

export function saleInfo(
  product: Pick<Product, 'hasVariants' | 'variants' | 'pricePaise' | 'compareAtPricePaise'>,
): SaleInfo {
  const variants = activeVariants(product)
  const entries =
    variants.length > 0
      ? variants.map((variant) => ({ price: variant.pricePaise, compare: variant.compareAtPaise }))
      : [{ price: product.pricePaise, compare: product.compareAtPricePaise }]
  const percents = entries.map((entry) => discountPercent(entry.price, entry.compare))
  const maxPercent = Math.max(0, ...percents.map((value) => value ?? 0))
  const lowest = entries.reduce((best, entry) => (entry.price < best.price ? entry : best), entries[0])
  const lowestCompare = discountPercent(lowest.price, lowest.compare) !== null ? lowest.compare : null
  return {
    onSale: maxPercent > 0,
    maxPercent,
    lowestPricePaise: lowest.price,
    lowestCompareAtPaise: lowestCompare,
    mixed: entries.length > 1 && (percents.some((value) => value === null) || new Set(percents).size > 1),
  }
}
