import type { ProductCardData } from '@/components/product/ProductCard'
import { imageUrl } from '@/data/media'
import {
  altTextFor,
  availabilityOf,
  coverPathOf,
  priceRange,
  saleInfo,
  type Product,
} from '@/domain/catalogue'

const accents: Array<'lime' | 'lavender' | 'orange'> = ['lime', 'lavender', 'orange']

function accentFor(seed: string): 'lime' | 'lavender' | 'orange' {
  let total = 0
  for (const character of seed) total += character.charCodeAt(0)
  return accents[total % accents.length]
}

export function toCardData(
  product: Pick<
    Product,
    | 'id'
    | 'slug'
    | 'name'
    | 'shortDescription'
    | 'hasVariants'
    | 'variants'
    | 'pricePaise'
    | 'compareAtPricePaise'
    | 'stockQuantity'
    | 'lowStockThreshold'
    | 'imagePaths'
    | 'coverImagePath'
    | 'altTexts'
    | 'isFeatured'
  >,
): ProductCardData {
  const cover = coverPathOf(product)
  const { minPaise, maxPaise } = priceRange(product)
  const sale = saleInfo(product)
  return {
    slug: product.slug,
    name: product.name || 'Untitled product',
    descriptor: product.shortDescription || undefined,
    pricePaise: minPaise,
    pricePrefix: maxPaise > minPaise ? 'From' : undefined,
    compareAtPaise: sale.lowestCompareAtPaise ?? undefined,
    discountPercent: sale.onSale ? sale.maxPercent : undefined,
    discountPrefix: sale.onSale && sale.mixed ? 'Up to ' : undefined,
    imageUrl: cover ? imageUrl(cover, 'small') : undefined,
    imageAlt: cover ? altTextFor(product, cover) : undefined,
    accent: accentFor(product.id),
    label: product.isFeatured ? 'Featured' : undefined,
    availability: availabilityOf(product),
  }
}
