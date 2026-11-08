import type { Address } from './address'
import type { ResolvedLine } from './cart'
import type { ContactStatus, OrderStatus, PaymentStatus } from './status'

export const MAX_ORDER_LINES = 20
export const ORDER_ID_PATTERN = /^SW-[0-9]{6}-[A-Z0-9]{5}$/

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export type OrderItem = {
  productId: string
  variantId: string | null
  name: string
  slug: string
  variantLabel: string
  quantity: number
  unitPaise: number
  lineTotalPaise: number
  imagePath: string | null
}

export type ShippingAddress = Pick<
  Address,
  'fullName' | 'phone' | 'line1' | 'line2' | 'landmark' | 'city' | 'state' | 'pinCode' | 'country'
>

export type Order = {
  id: string
  orderNumber: string
  customerUid: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerInstagram: string
  shippingAddress: ShippingAddress
  note: string
  items: OrderItem[]
  itemCount: number
  subtotalPaise: number
  shippingPaise: number | null
  totalPaise: number
  finalTotalPaise: number | null
  totalChangeReason: string
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  contactStatus: ContactStatus
  adminNote: string
  customerVisibleNote: string
  stockDeducted: boolean
  stockReturned: boolean
  courierName: string
  trackingReference: string
  trackingUrl: string
  cancelReason: string
  createdAtMs: number
  updatedAtMs: number
}

export type OrderEvent = {
  id: string
  type: string
  message: string
  visibility: 'customer' | 'internal'
  fromStatus: string
  toStatus: string
  actorUid: string
  createdAtMs: number
}

export function generateOrderId(now: Date = new Date(), random: (n: number) => Uint8Array = randomBytes): string {
  const yy = String(now.getFullYear() % 100).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const bytes = random(5)
  let suffix = ''
  for (const byte of bytes) suffix += ALPHABET[byte % ALPHABET.length]
  return `SW-${yy}${mm}${dd}-${suffix}`
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

export function itemsFromResolved(lines: ResolvedLine[]): OrderItem[] {
  return lines
    .filter((item) => item.status === 'ok')
    .map((item) => ({
      productId: item.line.productId,
      variantId: item.line.variantId,
      name: item.name,
      slug: item.line.slug,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      unitPaise: item.unitPaise,
      lineTotalPaise: item.lineTotalPaise,
      imagePath: item.imagePath,
    }))
}

export function itemsSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPaise * item.quantity, 0)
}

export function itemsCount(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export type CartCheck = { ok: true } | { ok: false; reasons: string[] }

export function checkCartForOrder(resolved: ResolvedLine[]): CartCheck {
  const reasons: string[] = []
  if (resolved.length === 0) reasons.push('Your cart is empty.')
  if (resolved.length > MAX_ORDER_LINES) reasons.push(`An order can have up to ${MAX_ORDER_LINES} different items.`)
  for (const item of resolved) {
    if (item.status === 'unavailable') reasons.push(`${item.name} is no longer available. Remove it from your cart.`)
    else if (item.priceChanged) reasons.push(`The price of ${item.name} changed. Please review your cart.`)
    else if (item.quantityReduced) reasons.push(`Only ${item.maxQuantity} of ${item.name} are in stock. Please review your cart.`)
  }
  return reasons.length === 0 ? { ok: true } : { ok: false, reasons }
}

export type ApprovalProduct = {
  status: string
  hasVariants: boolean
  pricePaise: number
  stockQuantity: number
  variants: Array<{ id: string; pricePaise: number; stockQuantity: number; isActive: boolean }>
}

export type ApprovalIssue = { index: number; message: string }

export type ApprovalLineCheck = {
  livePaise: number | null
  issue: string | null
}

export function checkLineForApproval(
  item: OrderItem,
  product: ApprovalProduct | null,
): ApprovalLineCheck {
  if (!product || product.status === 'draft') {
    return { livePaise: null, issue: 'This product is no longer available.' }
  }
  if (product.hasVariants) {
    const variant = product.variants.find((entry) => entry.id === item.variantId)
    if (!variant || !variant.isActive) return { livePaise: null, issue: 'This option is no longer available.' }
    if (variant.stockQuantity < item.quantity) {
      return { livePaise: variant.pricePaise, issue: `Only ${variant.stockQuantity} in stock.` }
    }
    return { livePaise: variant.pricePaise, issue: null }
  }
  if (product.stockQuantity < item.quantity) {
    return { livePaise: product.pricePaise, issue: `Only ${product.stockQuantity} in stock.` }
  }
  return { livePaise: product.pricePaise, issue: null }
}

export function validateApproval(input: {
  shippingPaise: number | null
  finalTotalPaise: number | null
  subtotalPaise: number
  reason: string
}): { shipping?: string; total?: string; reason?: string } {
  const errors: { shipping?: string; total?: string; reason?: string } = {}
  if (input.shippingPaise === null) errors.shipping = 'Enter the shipping charge. Use 0 for free shipping.'
  if (input.finalTotalPaise === null) errors.total = 'Enter the final total.'
  if (input.shippingPaise !== null && input.finalTotalPaise !== null) {
    const expected = input.subtotalPaise + input.shippingPaise
    if (input.finalTotalPaise !== expected && input.reason.trim().length === 0) {
      errors.reason = 'Explain why the final total differs from items plus shipping.'
    }
  }
  return errors
}

export function safeTrackingUrl(value: string): string | null {
  const trimmed = value.trim()
  return /^https?:\/\/\S+$/i.test(trimmed) && trimmed.length <= 500 ? trimmed : null
}

export type DispatchInput = { courierName: string; trackingReference: string; trackingUrl: string }

export function validateDispatch(input: DispatchInput): { courierName?: string; trackingUrl?: string } {
  const errors: { courierName?: string; trackingUrl?: string } = {}
  if (!input.courierName.trim()) errors.courierName = 'Enter the courier name.'
  else if (input.courierName.trim().length > 100) errors.courierName = 'Keep this under 100 characters.'
  if (input.trackingUrl.trim() && !safeTrackingUrl(input.trackingUrl)) {
    errors.trackingUrl = 'Enter a full link starting with https://'
  }
  return errors
}
