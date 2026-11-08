import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import {
  MAX_PER_LINE,
  addLine,
  cartCount,
  lineKey,
  parseStoredCart,
  resolveLines,
  setLineQuantity,
  subtotalPaise,
  type CartLine,
} from '../../src/domain/cart'
import { emptyAddressInput, normalizePhone, validateAddress } from '../../src/domain/address'
import { emptyProductInput, type Product } from '../../src/domain/catalogue'

const line = (over: Partial<CartLine> = {}): CartLine => ({
  productId: 'p1',
  variantId: null,
  quantity: 1,
  name: 'Cloud',
  slug: 'cloud',
  variantLabel: '',
  unitPaise: 30000,
  imagePath: null,
  ...over,
})

const product = (over: Partial<Product> = {}): Product => ({
  ...emptyProductInput(),
  id: 'p1',
  name: 'Cloud',
  slug: 'cloud',
  status: 'published',
  pricePaise: 30000,
  stockQuantity: 5,
  createdAtMs: 0,
  updatedAtMs: 0,
  ...over,
})

describe('cart lines', () => {
  it('merges the same product and variant and caps the quantity', () => {
    const merged = addLine([line({ quantity: 4 })], line({ quantity: 4 }), 6)
    assert.equal(merged.length, 1)
    assert.equal(merged[0].quantity, 6)
    assert.equal(addLine([], line({ quantity: 50 }))[0].quantity, MAX_PER_LINE)
  })

  it('keeps variants as separate lines', () => {
    const lines = addLine([line({ variantId: 'a' })], line({ variantId: 'b' }))
    assert.equal(lines.length, 2)
    assert.equal(cartCount(lines), 2)
  })

  it('removes a line when the quantity reaches zero', () => {
    assert.equal(setLineQuantity([line()], lineKey(line()), 0).length, 0)
  })

  it('ignores corrupted stored data', () => {
    assert.deepEqual(parseStoredCart('not json'), [])
    assert.equal(parseStoredCart(JSON.stringify([{ productId: 1 }, line()])).length, 1)
    assert.deepEqual(parseStoredCart(JSON.stringify([line({ quantity: 99 })])), [])
  })
})

describe('resolving against live products', () => {
  it('uses live prices and flags changes', () => {
    const live = new Map([['p1', product({ pricePaise: 32000 })]])
    const [item] = resolveLines([line({ quantity: 2 })], live)
    assert.equal(item.status, 'ok')
    assert.equal(item.unitPaise, 32000)
    assert.equal(item.priceChanged, true)
    assert.equal(subtotalPaise([item]), 64000)
  })

  it('reduces quantity to the stock available', () => {
    const live = new Map([['p1', product({ stockQuantity: 1 })]])
    const [item] = resolveLines([line({ quantity: 3 })], live)
    assert.equal(item.quantity, 1)
    assert.equal(item.quantityReduced, true)
  })

  it('marks missing, unpublished and sold-out items unavailable', () => {
    const live = new Map<string, Product | null>([
      ['p1', product({ status: 'draft' })],
      ['p2', product({ id: 'p2', stockQuantity: 0 })],
    ])
    const items = resolveLines(
      [line(), line({ productId: 'p2' }), line({ productId: 'p3' })],
      live,
    )
    assert.ok(items.every((item) => item.status === 'unavailable'))
    assert.equal(subtotalPaise(items), 0)
  })

  it('prices variants from the variant', () => {
    const variant = { id: 'v1', label: '60 ml', sku: '', pricePaise: 19900, compareAtPaise: null, stockQuantity: 3, isActive: true }
    const live = new Map([['p1', product({ hasVariants: true, variants: [variant] })]])
    const [item] = resolveLines([line({ variantId: 'v1' })], live)
    assert.equal(item.unitPaise, 19900)
    assert.equal(item.variantLabel, '60 ml')
  })
})

describe('address validation', () => {
  const valid = {
    ...emptyAddressInput(),
    fullName: 'Asha',
    phone: '98765 43210',
    line1: '4 Rose Lane',
    city: 'Jaipur',
    state: 'Rajasthan',
    pinCode: '302001',
  }

  it('accepts a complete address', () => {
    assert.deepEqual(validateAddress(valid), {})
  })

  it('normalises Indian mobile numbers', () => {
    assert.equal(normalizePhone('+91 98765-43210'), '+919876543210')
    assert.equal(normalizePhone('09876543210'), '+919876543210')
    assert.equal(normalizePhone('5876543210'), null)
    assert.equal(normalizePhone('12345'), null)
  })

  it('rejects bad PIN codes and missing fields', () => {
    const errors = validateAddress({ ...valid, pinCode: '012345', city: '', state: '' })
    assert.deepEqual(Object.keys(errors).sort(), ['city', 'pinCode', 'state'])
  })
})
