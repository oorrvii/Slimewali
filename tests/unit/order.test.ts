import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import {
  ORDER_ID_PATTERN,
  checkLineForApproval,
  generateOrderId,
  itemsCount,
  itemsSubtotal,
  safeTrackingUrl,
  validateApproval,
  validateDispatch,
  type OrderItem,
} from '../../src/domain/order'
import { canTransition } from '../../src/domain/status'

const item = (over: Partial<OrderItem> = {}): OrderItem => ({
  productId: 'p1',
  variantId: null,
  name: 'Cloud',
  slug: 'cloud',
  variantLabel: '',
  quantity: 2,
  unitPaise: 30000,
  lineTotalPaise: 60000,
  imagePath: null,
  ...over,
})

describe('order references', () => {
  it('matches the pattern the security rules enforce', () => {
    for (let i = 0; i < 50; i++) assert.match(generateOrderId(), ORDER_ID_PATTERN)
    assert.equal(generateOrderId(new Date(2026, 10, 8), () => new Uint8Array([0, 1, 2, 3, 4])), 'SW-261108-ABCDE')
  })
})

describe('order totals', () => {
  it('sums items and quantities', () => {
    const items = [item(), item({ productId: 'p2', quantity: 1, unitPaise: 10000 })]
    assert.equal(itemsSubtotal(items), 70000)
    assert.equal(itemsCount(items), 3)
  })
})

describe('approval checks', () => {
  const product = { status: 'published', hasVariants: false, pricePaise: 30000, stockQuantity: 5, variants: [] }

  it('passes when stock and price are fine', () => {
    assert.deepEqual(checkLineForApproval(item(), product), { livePaise: 30000, issue: null })
  })

  it('blocks missing, draft and understocked products', () => {
    assert.ok(checkLineForApproval(item(), null).issue)
    assert.ok(checkLineForApproval(item(), { ...product, status: 'draft' }).issue)
    assert.ok(checkLineForApproval(item({ quantity: 6 }), product).issue)
  })

  it('checks the chosen variant', () => {
    const variants = [{ id: 'v1', pricePaise: 19900, stockQuantity: 1, isActive: true }]
    const withVariants = { ...product, hasVariants: true, variants }
    assert.equal(checkLineForApproval(item({ variantId: 'v1', quantity: 1 }), withVariants).issue, null)
    assert.ok(checkLineForApproval(item({ variantId: 'v1', quantity: 2 }), withVariants).issue)
    assert.ok(checkLineForApproval(item({ variantId: 'gone' }), withVariants).issue)
  })

  it('requires shipping, a total, and a reason when the total differs', () => {
    assert.deepEqual(Object.keys(validateApproval({ shippingPaise: null, finalTotalPaise: null, subtotalPaise: 1000, reason: '' })).sort(), ['shipping', 'total'])
    assert.deepEqual(validateApproval({ shippingPaise: 6000, finalTotalPaise: 7000, subtotalPaise: 1000, reason: '' }), {})
    assert.ok(validateApproval({ shippingPaise: 6000, finalTotalPaise: 8000, subtotalPaise: 1000, reason: '' }).reason)
    assert.deepEqual(validateApproval({ shippingPaise: 6000, finalTotalPaise: 8000, subtotalPaise: 1000, reason: 'Rush' }), {})
  })
})

describe('status transitions', () => {
  it('only allows the planned steps', () => {
    assert.equal(canTransition('pending_review', 'approved_awaiting_payment'), true)
    assert.equal(canTransition('pending_review', 'delivered'), false)
    assert.equal(canTransition('rejected', 'approved_awaiting_payment'), false)
    assert.equal(canTransition('dispatched', 'delivered'), true)
  })
})

describe('dispatch details', () => {
  it('needs a courier and only accepts web links', () => {
    assert.ok(validateDispatch({ courierName: '', trackingReference: '', trackingUrl: '' }).courierName)
    assert.deepEqual(validateDispatch({ courierName: 'DTDC', trackingReference: '', trackingUrl: '' }), {})
    assert.ok(validateDispatch({ courierName: 'DTDC', trackingReference: '', trackingUrl: 'javascript:alert(1)' }).trackingUrl)
    assert.equal(safeTrackingUrl('https://example.com/t/1'), 'https://example.com/t/1')
    assert.equal(safeTrackingUrl('ftp://example.com'), null)
    assert.equal(safeTrackingUrl('https://exa mple.com'), null)
  })
})
