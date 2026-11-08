import { activeVariants, type Product } from './catalogue'

export const MAX_PER_LINE = 10
export const CART_STORAGE_KEY = 'slimewali.cart.v1'
const MAX_LINES = 40

export type CartLine = {
  productId: string
  variantId: string | null
  quantity: number
  name: string
  slug: string
  variantLabel: string
  unitPaise: number
  imagePath: string | null
}

export function lineKey(line: Pick<CartLine, 'productId' | 'variantId'>): string {
  return `${line.productId}::${line.variantId ?? ''}`
}

export function addLine(lines: CartLine[], line: CartLine, maxQuantity: number = MAX_PER_LINE): CartLine[] {
  const cap = Math.max(1, Math.min(maxQuantity, MAX_PER_LINE))
  const key = lineKey(line)
  const existing = lines.find((item) => lineKey(item) === key)
  if (existing) {
    return lines.map((item) =>
      lineKey(item) === key
        ? { ...line, quantity: Math.min(cap, item.quantity + line.quantity) }
        : item,
    )
  }
  if (lines.length >= MAX_LINES) return lines
  return [...lines, { ...line, quantity: Math.min(cap, line.quantity) }]
}

export function setLineQuantity(lines: CartLine[], key: string, quantity: number): CartLine[] {
  if (quantity <= 0) return lines.filter((item) => lineKey(item) !== key)
  return lines.map((item) =>
    lineKey(item) === key ? { ...item, quantity: Math.min(quantity, MAX_PER_LINE) } : item,
  )
}

export function removeLine(lines: CartLine[], key: string): CartLine[] {
  return lines.filter((item) => lineKey(item) !== key)
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0)
}

function isLine(value: unknown): value is CartLine {
  if (typeof value !== 'object' || value === null) return false
  const line = value as Record<string, unknown>
  return (
    typeof line.productId === 'string' &&
    line.productId.length > 0 &&
    (line.variantId === null || typeof line.variantId === 'string') &&
    Number.isInteger(line.quantity) &&
    (line.quantity as number) >= 1 &&
    (line.quantity as number) <= MAX_PER_LINE &&
    typeof line.name === 'string' &&
    typeof line.slug === 'string' &&
    typeof line.variantLabel === 'string' &&
    Number.isInteger(line.unitPaise) &&
    (line.unitPaise as number) >= 0 &&
    (line.imagePath === null || typeof line.imagePath === 'string')
  )
}

export function parseStoredCart(raw: string | null): CartLine[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const seen = new Set<string>()
    const result: CartLine[] = []
    for (const item of parsed) {
      if (!isLine(item)) continue
      const key = lineKey(item)
      if (seen.has(key)) continue
      seen.add(key)
      result.push(item)
      if (result.length >= MAX_LINES) break
    }
    return result
  } catch {
    return []
  }
}

export type LineStatus = 'ok' | 'unavailable'

export type ResolvedLine = {
  line: CartLine
  key: string
  status: LineStatus
  unitPaise: number
  compareAtPaise: number | null
  quantity: number
  maxQuantity: number
  lineTotalPaise: number
  priceChanged: boolean
  quantityReduced: boolean
  name: string
  variantLabel: string
  imagePath: string | null
}

export function resolveLines(lines: CartLine[], products: Map<string, Product | null>): ResolvedLine[] {
  return lines.map((line) => {
    const key = lineKey(line)
    const product = products.get(line.productId) ?? null
    const unavailable: ResolvedLine = {
      line,
      key,
      status: 'unavailable',
      unitPaise: line.unitPaise,
      compareAtPaise: null,
      quantity: line.quantity,
      maxQuantity: 0,
      lineTotalPaise: 0,
      priceChanged: false,
      quantityReduced: false,
      name: line.name,
      variantLabel: line.variantLabel,
      imagePath: line.imagePath,
    }
    if (!product || product.status !== 'published') return unavailable

    let unitPaise = product.pricePaise
    let compareAtPaise = product.compareAtPricePaise
    let stock = product.stockQuantity
    let variantLabel = ''
    if (product.hasVariants) {
      const variant = activeVariants(product).find((item) => item.id === line.variantId)
      if (!variant) return unavailable
      unitPaise = variant.pricePaise
      compareAtPaise = variant.compareAtPaise
      stock = variant.stockQuantity
      variantLabel = variant.label
    }
    const maxQuantity = Math.max(0, Math.min(stock, MAX_PER_LINE))
    if (maxQuantity === 0) return unavailable
    const quantity = Math.min(line.quantity, maxQuantity)
    return {
      line,
      key,
      status: 'ok',
      unitPaise,
      compareAtPaise: compareAtPaise !== null && compareAtPaise > unitPaise ? compareAtPaise : null,
      quantity,
      maxQuantity,
      lineTotalPaise: unitPaise * quantity,
      priceChanged: unitPaise !== line.unitPaise,
      quantityReduced: quantity < line.quantity,
      name: product.name,
      variantLabel,
      imagePath: product.coverImagePath && product.imagePaths.includes(product.coverImagePath)
        ? product.coverImagePath
        : (product.imagePaths[0] ?? null),
    }
  })
}

export function savingsPaise(resolved: ResolvedLine[]): number {
  return resolved.reduce(
    (sum, item) =>
      item.status === 'ok' && item.compareAtPaise !== null
        ? sum + (item.compareAtPaise - item.unitPaise) * item.quantity
        : sum,
    0,
  )
}

export function subtotalPaise(resolved: ResolvedLine[]): number {
  return resolved.reduce((sum, item) => (item.status === 'ok' ? sum + item.lineTotalPaise : sum), 0)
}
