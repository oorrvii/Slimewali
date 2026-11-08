import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { slugify, isValidSlug } from '../../src/domain/slug'
import { parseRupeesToPaise, paiseToInput, formatPaise } from '../../src/domain/money'
import { availabilityOf, totalStock, priceRange, coverPathOf, emptyProductInput, emptyCategoryInput } from '../../src/domain/catalogue'
import { validateProduct, validateForPublish, validateCategory } from '../../src/domain/validators'

describe('catalogue domain logic', () => {
  it('slugs, prices, availability and validation behave', () => {
    assert.equal(slugify('Butter & Cloud Slime!'), 'butter-and-cloud-slime')
    assert.equal(slugify('  Crème   Brûlée '), 'creme-brulee')
    assert.equal(slugify('---'), '')
    assert.equal(slugify('a'.repeat(80)).length, 60)
    assert.ok(isValidSlug('butter-slime-2'))
    for (const bad of ['', 'Butter', 'a--b', '-a', 'a-', 'a b', 'a_b']) assert.equal(isValidSlug(bad), false, bad)

    assert.equal(parseRupeesToPaise('199'), 19900)
    assert.equal(parseRupeesToPaise('₹1,299.5'), 129950)
    assert.equal(parseRupeesToPaise('0.05'), 5)
    assert.equal(parseRupeesToPaise('12.345'), null)
    assert.equal(parseRupeesToPaise('-5'), null)
    assert.equal(parseRupeesToPaise('abc'), null)
    assert.equal(parseRupeesToPaise(''), null)
    assert.equal(parseRupeesToPaise('99999999999'), null)
    assert.equal(paiseToInput(19900), '199')
    assert.equal(paiseToInput(129950), '1299.50')
    assert.equal(paiseToInput(undefined), '')
    assert.match(formatPaise(129950), /1,299\.5/)

    const simple = { hasVariants: false, variants: [], stockQuantity: 10, lowStockThreshold: 3 }
    assert.equal(availabilityOf(simple), 'in_stock')
    assert.equal(availabilityOf({ ...simple, stockQuantity: 3 }), 'low_stock')
    assert.equal(availabilityOf({ ...simple, stockQuantity: 0 }), 'out_of_stock')
    const v = (id: string, p: number, s: number, a = true) => ({ id, label: id, sku: '', pricePaise: p, compareAtPaise: null, stockQuantity: s, isActive: a })
    const withVariants = { hasVariants: true, stockQuantity: 99, lowStockThreshold: 3, pricePaise: 0, variants: [v('s', 10000, 2), v('m', 20000, 5), v('x', 5000, 100, false)] }
    assert.equal(totalStock(withVariants), 7)
    assert.deepEqual(priceRange(withVariants), { minPaise: 10000, maxPaise: 20000 })
    assert.equal(availabilityOf({ ...withVariants, variants: [v('s', 1, 0)] }), 'out_of_stock')
    assert.equal(coverPathOf({ coverImagePath: 'b', imagePaths: ['a', 'b'] }), 'b')
    assert.equal(coverPathOf({ coverImagePath: 'gone', imagePaths: ['a', 'b'] }), 'a')
    assert.equal(coverPathOf({ coverImagePath: null, imagePaths: [] }), null)

    const ok = { ...emptyProductInput(), name: 'Cloud', slug: 'cloud', categoryId: 'c1', pricePaise: 29900, stockQuantity: 5, description: 'Soft', imagePaths: ['p/1.webp'] }
    assert.deepEqual(validateProduct(ok), {})
    assert.deepEqual(validateForPublish(ok), {})
    assert.ok(validateForPublish({ ...ok, imagePaths: [] }).images)
    assert.ok(validateForPublish({ ...ok, description: ' ' }).description)
    assert.ok(validateProduct({ ...ok, pricePaise: 0 }).pricePaise)
    assert.ok(validateProduct({ ...ok, pricePaise: 10.5 }).pricePaise)
    assert.ok(validateProduct({ ...ok, stockQuantity: -1 }).stockQuantity)
    assert.ok(validateProduct({ ...ok, categoryId: '' }).categoryId)
    assert.ok(validateProduct({ ...ok, slug: 'Bad Slug' }).slug)
    assert.ok(validateProduct({ ...ok, compareAtPricePaise: 29900 }).compareAtPricePaise)
    assert.deepEqual(validateProduct({ ...ok, compareAtPricePaise: 39900 }), {})
    const varOk = { ...ok, hasVariants: true, variants: [v('Small', 10000, 2), v('Large', 20000, 0)] }
    assert.deepEqual(validateProduct(varOk), {})
    assert.ok(validateProduct({ ...varOk, variants: [] }).variants)
    assert.ok(validateProduct({ ...varOk, variants: [v('Small', 10000, 2), v('small', 20000, 1)] })['variant-1-label'])
    assert.ok(validateProduct({ ...varOk, variants: [v('Small', 0, 2)] })['variant-0-price'])

    const cat = { ...emptyCategoryInput(), name: 'Butter', slug: 'butter' }
    assert.deepEqual(validateCategory(cat), {})
    assert.ok(validateCategory({ ...cat, name: ' ' }).name)
    assert.ok(validateCategory({ ...cat, accentColor: '#FF0000' as never }).accentColor)
    assert.ok(validateCategory({ ...cat, slug: 'Butter!' }).slug)
  })
})
