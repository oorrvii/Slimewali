import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { normalizeInstagram } from '../../src/domain/address'
import { PAGE_DEFINITIONS, isPageId, parseBody, validatePage } from '../../src/domain/content'
import { buildMessage, defaultKindFor, hasUnfilledPlaceholder } from '../../src/domain/messages'
import {
  DEFAULT_SETTINGS,
  shippingDescription,
  suggestShippingPaise,
  validateSettings,
  whatsappLink,
} from '../../src/domain/settings'
import type { Order } from '../../src/domain/order'

describe('instagram', () => {
  it('normalises handles and urls', () => {
    assert.equal(normalizeInstagram('@Slime.Fan'), 'Slime.Fan')
    assert.equal(normalizeInstagram('https://instagram.com/slime_fan/'), 'slime_fan')
    assert.equal(normalizeInstagram(''), '')
    assert.equal(normalizeInstagram('bad handle!'), null)
    assert.equal(normalizeInstagram('a'.repeat(31)), null)
  })
})

describe('settings', () => {
  it('defaults are valid', () => {
    assert.deepEqual(validateSettings(DEFAULT_SETTINGS), {})
  })
  it('rejects bad values', () => {
    const errors = validateSettings({ ...DEFAULT_SETTINGS, supportEmail: 'x', whatsappNumber: '123', shippingMode: 'threshold' })
    assert.ok(errors.supportEmail && errors.whatsappNumber && errors.freeShippingThresholdPaise)
    assert.ok(validateSettings({ ...DEFAULT_SETTINGS, announcementText: '' }).announcementText)
  })
  it('suggests shipping', () => {
    assert.equal(suggestShippingPaise(DEFAULT_SETTINGS, 1000), null)
    const flat = { ...DEFAULT_SETTINGS, shippingMode: 'flat' as const, flatShippingPaise: 6000 }
    assert.equal(suggestShippingPaise(flat, 1000), 6000)
    const th = { ...flat, shippingMode: 'threshold' as const, freeShippingThresholdPaise: 50000 }
    assert.equal(suggestShippingPaise(th, 49999), 6000)
    assert.equal(suggestShippingPaise(th, 50000), 0)
    assert.ok(shippingDescription(th).includes('free'))
  })
  it('builds a whatsapp link', () => {
    assert.equal(whatsappLink('9876543210', 'hi there'), 'https://wa.me/919876543210?text=hi%20there')
    assert.equal(whatsappLink('12'), null)
  })
})

describe('content', () => {
  it('parses headings, lists and paragraphs', () => {
    const blocks = parseBody('One\ntwo\n\n## Head\n- a\n- b\n\nEnd')
    assert.deepEqual(blocks, [
      { type: 'paragraph', text: 'One two' },
      { type: 'heading', text: 'Head' },
      { type: 'list', items: ['a', 'b'] },
      { type: 'paragraph', text: 'End' },
    ])
  })
  it('validates pages', () => {
    assert.ok(validatePage({ title: '', body: '', items: [], isPublished: false }).title)
    assert.ok(validatePage({ title: 'A', body: '', items: [], isPublished: true }).body)
    assert.ok(validatePage({ title: 'A', body: '', items: [{ question: 'q', answer: '' }], isPublished: false }).items)
    assert.deepEqual(validatePage({ title: 'A', body: 'x', items: [], isPublished: true }), {})
  })
  it('knows the page ids', () => {
    assert.equal(PAGE_DEFINITIONS.length, 7)
    assert.ok(isPageId('faq'))
    assert.ok(!isPageId('admin'))
  })
})

describe('messages', () => {
  const order = {
    orderNumber: 'SW-261108-AB234', customerName: 'Alice Rao', totalPaise: 36900, finalTotalPaise: 42900,
    orderStatus: 'dispatched', courierName: 'DTDC', trackingReference: 'X1', trackingUrl: 'https://t.example/x1',
    customerVisibleNote: '', cancelReason: '',
  } as unknown as Order
  it('fills placeholders', () => {
    const text = buildMessage('dispatched', order, DEFAULT_SETTINGS)
    assert.ok(text.includes('Hi Alice') && text.includes('DTDC') && text.includes('X1'))
    assert.equal(defaultKindFor('dispatched'), 'dispatched')
  })
  it('flags the payment placeholder', () => {
    const text = buildMessage('approved', order, DEFAULT_SETTINGS)
    assert.ok(hasUnfilledPlaceholder(text) && text.includes('₹429'))
  })
})

import { discountPercent, saleInfo } from '../../src/domain/catalogue'
import { isSaleLive } from '../../src/domain/settings'
import { buildAlertParams } from '../../src/domain/notify'
import { savingsPaise, type ResolvedLine } from '../../src/domain/cart'

describe('discounts', () => {
  it('computes percent off', () => {
    assert.equal(discountPercent(24900, 29900), 16)
    assert.equal(discountPercent(30000, 30000), null)
    assert.equal(discountPercent(30000, 20000), null)
    assert.equal(discountPercent(30000, null), null)
    assert.equal(discountPercent(29999, 30000), null)
  })
  it('summarises a simple product and a variant product', () => {
    const simple = saleInfo({ hasVariants: false, variants: [], pricePaise: 8000, compareAtPricePaise: 10000 })
    assert.equal(simple.onSale, true)
    assert.equal(simple.maxPercent, 20)
    assert.equal(simple.lowestCompareAtPaise, 10000)
    assert.equal(simple.mixed, false)
    const v = (id: string, price: number, compare: number | null, active = true) => ({ id, label: id, sku: '', pricePaise: price, compareAtPaise: compare, stockQuantity: 1, isActive: active })
    const multi = saleInfo({ hasVariants: true, variants: [v('a', 10000, 20000), v('b', 30000, null), v('c', 5000, 50000, false)], pricePaise: 0, compareAtPricePaise: null })
    assert.equal(multi.maxPercent, 50)
    assert.equal(multi.mixed, true)
    assert.equal(multi.lowestPricePaise, 10000)
    assert.equal(saleInfo({ hasVariants: false, variants: [], pricePaise: 100, compareAtPricePaise: null }).onSale, false)
  })
  it('sums cart savings only for ok lines', () => {
    const lines = [
      { status: 'ok', unitPaise: 8000, compareAtPaise: 10000, quantity: 2 },
      { status: 'ok', unitPaise: 500, compareAtPaise: null, quantity: 1 },
      { status: 'unavailable', unitPaise: 1, compareAtPaise: 99, quantity: 1 },
    ] as unknown as ResolvedLine[]
    assert.equal(savingsPaise(lines), 4000)
  })
})

describe('sale banner', () => {
  const base = { saleActive: true, saleTitle: 'Diwali', saleEndsOn: '2026-11-10' }
  it('respects the switch, title and end date in India time', () => {
    assert.equal(isSaleLive(base, new Date('2026-11-10T12:00:00Z')), true)
    assert.equal(isSaleLive(base, new Date('2026-11-10T19:00:00Z')), false)
    assert.equal(isSaleLive({ ...base, saleActive: false }), false)
    assert.equal(isSaleLive({ ...base, saleTitle: ' ' }), false)
    assert.equal(isSaleLive({ ...base, saleEndsOn: '' }, new Date('2030-01-01')), true)
  })
  it('validates sale settings', () => {
    assert.ok(validateSettings({ ...DEFAULT_SETTINGS, saleActive: true }).saleTitle)
    assert.ok(validateSettings({ ...DEFAULT_SETTINGS, saleEndsOn: '2026-13-40' }).saleEndsOn)
  })
})

describe('order alert', () => {
  it('builds email params', () => {
    const params = buildAlertParams({
      orderNumber: 'SW-261108-AB234', customerName: 'Alice', customerEmail: 'a@x.in', customerPhone: '+919876543210',
      customerInstagram: '', city: 'Pune', state: 'Maharashtra',
      items: [{ productId: 'p', variantId: null, name: 'Cloud', slug: 'c', variantLabel: '60 ml', quantity: 2, unitPaise: 10000, lineTotalPaise: 20000, imagePath: null }],
      subtotalPaise: 20000, origin: 'https://shop.example',
    })
    assert.equal(params.customer_instagram, 'not given')
    assert.equal(params.admin_link, 'https://shop.example/admin/orders/SW-261108-AB234')
    assert.ok(params.items.includes('2 x Cloud (60 ml)'))
  })
})

import { csvCell, ordersToCsv } from '../../src/domain/csv'

describe('csv backup', () => {
  it('escapes cells and blocks spreadsheet formulas', () => {
    assert.equal(csvCell('plain'), 'plain')
    assert.equal(csvCell('a,b'), '"a,b"')
    assert.equal(csvCell('say "hi"'), '"say ""hi"""')
    assert.equal(csvCell('=SUM(A1)'), "'=SUM(A1)")
    assert.equal(csvCell('+91'), "'+91")
    assert.equal(csvCell(12), '12')
  })
  it('writes a header and one row per order', () => {
    const order = {
      orderNumber: 'SW-261108-AB234', createdAtMs: 0, orderStatus: 'pending_review', paymentStatus: 'not_requested',
      customerName: 'Alice', customerEmail: 'a@x.in', customerPhone: '+919876543210', customerInstagram: 'alice',
      items: [{ quantity: 2, name: 'Cloud', variantLabel: '' }], subtotalPaise: 61800, shippingPaise: null, finalTotalPaise: null,
      shippingAddress: { line1: '1 Road', line2: '', landmark: '', city: 'Pune', state: 'Maharashtra', pinCode: '411001' },
      courierName: '', trackingReference: '', note: 'hi, there', adminNote: '',
    } as unknown as Order
    const lines = ordersToCsv([order]).split('\r\n')
    assert.equal(lines.length, 2)
    assert.ok(lines[0].startsWith('Order number,Placed at'))
    assert.ok(lines[1].includes('618.00') && lines[1].includes('"hi, there"') && lines[1].includes("'+919876543210"))
  })
})
