import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { createEnv, validAddress, validCategory, validOrder, validProduct } from './helpers'

let env: RulesTestEnvironment

const alice = { email: 'alice@example.com' }
const admin = { email: 'owner@example.com', admin: true }

beforeAll(async () => {
  env = await createEnv()
})

afterAll(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'users/alice'), { displayName: 'Alice', email: 'alice@example.com', createdAt: new Date(), updatedAt: new Date() })
    await setDoc(doc(db, 'users/bob'), { displayName: 'Bob', email: 'bob@example.com', createdAt: new Date(), updatedAt: new Date() })
    await setDoc(doc(db, 'users/alice/addresses/a1'), validAddress(new Date()))
    await setDoc(doc(db, 'categories/live'), { name: 'Live', isActive: true })
    await setDoc(doc(db, 'categories/hidden'), { name: 'Hidden', isActive: false })
    await setDoc(doc(db, 'products/pub'), { name: 'Pub', status: 'published', pricePaise: 10000 })
    await setDoc(doc(db, 'products/draft'), { name: 'Draft', status: 'draft', pricePaise: 10000 })
    await setDoc(doc(db, 'orders/o1'), { customerUid: 'alice', orderStatus: 'pending_review', totalPaise: 10000 })
    await setDoc(doc(db, 'orders/o1/events/e1'), { action: 'created' })
    await setDoc(doc(db, 'orders/SW-261108-ZZ999'), validOrder(new Date(), 'alice', 'alice@example.com', 'SW-261108-ZZ999'))
    await setDoc(doc(db, 'orders/SW-261108-ZZ999/events/pub'), { type: 'note', message: 'Visible', visibility: 'customer', customerUid: 'alice', actorUid: 'owner', createdAt: new Date() })
    await setDoc(doc(db, 'orders/SW-261108-ZZ999/events/priv'), { type: 'note', message: 'Hidden', visibility: 'internal', customerUid: 'alice', actorUid: 'owner', createdAt: new Date() })
    await setDoc(doc(db, 'settings/store'), { storeName: 'Slimewali' })
    await setDoc(doc(db, 'content/pages_live'), { title: 'About', isPublished: true })
    await setDoc(doc(db, 'content/pages_draft'), { title: 'Draft', isPublished: false })
  })
})

describe('users', () => {
  it('guest cannot read any profile', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'users/alice')))
  })

  it('owner can read own profile but not another customer profile', async () => {
    const db = env.authenticatedContext('alice', alice).firestore()
    await assertSucceeds(getDoc(doc(db, 'users/alice')))
    await assertFails(getDoc(doc(db, 'users/bob')))
  })

  it('owner can create own profile with allowed fields only', async () => {
    const db = env.authenticatedContext('carol', { email: 'carol@example.com' }).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'users/carol'), {
        displayName: 'Carol',
        email: 'carol@example.com',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('profile creation cannot include a role or admin field', async () => {
    const db = env.authenticatedContext('carol', { email: 'carol@example.com' }).firestore()
    await assertFails(
      setDoc(doc(db, 'users/carol'), {
        displayName: 'Carol',
        email: 'carol@example.com',
        roleLabel: 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )
    await assertFails(
      setDoc(doc(db, 'users/carol'), {
        displayName: 'Carol',
        email: 'carol@example.com',
        admin: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('profile creation must use the signed-in email', async () => {
    const db = env.authenticatedContext('carol', { email: 'carol@example.com' }).firestore()
    await assertFails(
      setDoc(doc(db, 'users/carol'), {
        displayName: 'Carol',
        email: 'someone-else@example.com',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('owner cannot add a role field or change email on update', async () => {
    const db = env.authenticatedContext('alice', alice).firestore()
    await assertFails(updateDoc(doc(db, 'users/alice'), { roleLabel: 'admin', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(doc(db, 'users/alice'), { email: 'x@example.com', updatedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(doc(db, 'users/alice'), { displayName: 'Alice B', updatedAt: serverTimestamp() }))
  })

  it('another customer cannot write to a profile', async () => {
    const db = env.authenticatedContext('bob', { email: 'bob@example.com' }).firestore()
    await assertFails(updateDoc(doc(db, 'users/alice'), { displayName: 'Hacked', updatedAt: serverTimestamp() }))
  })

  it('profiles cannot be deleted from the client', async () => {
    const db = env.authenticatedContext('alice', alice).firestore()
    await assertFails(deleteDoc(doc(db, 'users/alice')))
  })
})

describe('addresses', () => {
  it('owner can create a valid address', async () => {
    const db = env.authenticatedContext('alice', alice).firestore()
    await assertSucceeds(setDoc(doc(db, 'users/alice/addresses/a2'), validAddress(serverTimestamp())))
  })

  it('rejects an invalid PIN code, phone and country', async () => {
    const db = env.authenticatedContext('alice', alice).firestore()
    await assertFails(setDoc(doc(db, 'users/alice/addresses/bad1'), { ...validAddress(serverTimestamp()), pinCode: '012345' }))
    await assertFails(setDoc(doc(db, 'users/alice/addresses/bad2'), { ...validAddress(serverTimestamp()), phone: '12345' }))
    await assertFails(setDoc(doc(db, 'users/alice/addresses/bad3'), { ...validAddress(serverTimestamp()), country: 'Nepal' }))
  })

  it('another customer cannot read or write addresses', async () => {
    const db = env.authenticatedContext('bob', { email: 'bob@example.com' }).firestore()
    await assertFails(getDoc(doc(db, 'users/alice/addresses/a1')))
    await assertFails(setDoc(doc(db, 'users/alice/addresses/a9'), validAddress(serverTimestamp())))
  })

  it('guest cannot read addresses', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'users/alice/addresses/a1')))
  })
})

describe('catalogue', () => {
  it('guest can read published products and active categories only', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertSucceeds(getDoc(doc(db, 'products/pub')))
    await assertFails(getDoc(doc(db, 'products/draft')))
    await assertSucceeds(getDoc(doc(db, 'categories/live')))
    await assertFails(getDoc(doc(db, 'categories/hidden')))
  })

  it('guest can list only when the query is limited to published products', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertSucceeds(getDocs(query(collection(db, 'products'), where('status', '==', 'published'))))
    await assertFails(getDocs(collection(db, 'products')))
  })

  it('customers cannot write products or categories', async () => {
    const db = env.authenticatedContext('alice', alice).firestore()
    await assertFails(setDoc(doc(db, 'products/new'), { name: 'X', status: 'published', pricePaise: 1 }))
    await assertFails(updateDoc(doc(db, 'products/pub'), { pricePaise: 1 }))
    await assertFails(setDoc(doc(db, 'categories/new'), { name: 'X', isActive: true }))
  })

  it('admin can read drafts and write products and categories', async () => {
    const db = env.authenticatedContext('owner', admin).firestore()
    await assertSucceeds(getDoc(doc(db, 'products/draft')))
    await assertSucceeds(setDoc(doc(db, 'products/new'), validProduct(new Date())))
    await assertSucceeds(setDoc(doc(db, 'categories/new'), validCategory(new Date())))
  })

  it('admin product writes are validated', async () => {
    const db = env.authenticatedContext('owner', admin).firestore()
    const now = new Date()
    await assertFails(setDoc(doc(db, 'products/bad1'), { ...validProduct(now), pricePaise: -1 }))
    await assertFails(setDoc(doc(db, 'products/bad2'), { ...validProduct(now), pricePaise: 199.5 }))
    await assertFails(setDoc(doc(db, 'products/bad3'), { ...validProduct(now), status: 'live' }))
    await assertFails(setDoc(doc(db, 'products/bad4'), { ...validProduct(now), slug: 'Bad Slug' }))
    await assertFails(setDoc(doc(db, 'products/bad5'), { ...validProduct(now), name: '' }))
    await assertFails(setDoc(doc(db, 'products/bad6'), { ...validProduct(now), stockQuantity: -3 }))
    await assertFails(setDoc(doc(db, 'products/bad7'), { ...validProduct(now), unexpectedField: true }))
    await assertFails(setDoc(doc(db, 'products/bad8'), { ...validProduct(now), imagePaths: [], status: 'published' }))
    await assertSucceeds(setDoc(doc(db, 'products/ok'), { ...validProduct(now), status: 'published' }))
  })

  it('admin category writes are validated', async () => {
    const db = env.authenticatedContext('owner', admin).firestore()
    const now = new Date()
    await assertFails(setDoc(doc(db, 'categories/bad1'), { ...validCategory(now), accentColor: '#FF0000' }))
    await assertFails(setDoc(doc(db, 'categories/bad2'), { ...validCategory(now), slug: 'Not Valid' }))
    await assertFails(setDoc(doc(db, 'categories/bad3'), { ...validCategory(now), name: '' }))
    await assertFails(setDoc(doc(db, 'categories/bad4'), { ...validCategory(now), isActive: 'yes' }))
  })

  it('slug index is admin only', async () => {
    const adminDb = env.authenticatedContext('owner', admin).firestore()
    const aliceDb = env.authenticatedContext('alice', alice).firestore()
    await assertSucceeds(setDoc(doc(adminDb, 'slugIndex/product_cloud'), { kind: 'product', refId: 'p1' }))
    await assertFails(setDoc(doc(adminDb, 'slugIndex/product_x'), { kind: 'order', refId: 'p1' }))
    await assertFails(getDoc(doc(aliceDb, 'slugIndex/product_cloud')))
    await assertFails(setDoc(doc(aliceDb, 'slugIndex/product_y'), { kind: 'product', refId: 'p1' }))
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'slugIndex/product_cloud')))
  })

  it('a user document field called admin does not grant admin access', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/alice'), { displayName: 'Alice', email: 'alice@example.com', admin: true, roleLabel: 'admin' })
    })
    const db = env.authenticatedContext('alice', alice).firestore()
    await assertFails(setDoc(doc(db, 'products/new'), { name: 'X', status: 'draft', pricePaise: 100 }))
  })
})

describe('orders', () => {
  it('owner can read own order, another customer and guest cannot', async () => {
    await assertSucceeds(getDoc(doc(env.authenticatedContext('alice', alice).firestore(), 'orders/o1')))
    await assertFails(getDoc(doc(env.authenticatedContext('bob', { email: 'bob@example.com' }).firestore(), 'orders/o1')))
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'orders/o1')))
  })

  it('customers can list only their own orders', async () => {
    const db = env.authenticatedContext('alice', alice).firestore()
    await assertSucceeds(getDocs(query(collection(db, 'orders'), where('customerUid', '==', 'alice'))))
    await assertFails(getDocs(collection(db, 'orders')))
  })

  it('a customer can create their own valid order request', async () => {
    const db = env.authenticatedContext('alice', alice).firestore()
    await assertSucceeds(setDoc(doc(db, 'orders/SW-261108-AB234'), validOrder(serverTimestamp())))
  })

  it('rejects forged order requests', async () => {
    const db = env.authenticatedContext('alice', alice).firestore()
    const now = serverTimestamp()
    await assertFails(setDoc(doc(db, 'orders/SW-261108-AB234'), { ...validOrder(now), orderStatus: 'payment_verified' }))
    await assertFails(setDoc(doc(db, 'orders/SW-261108-AB234'), { ...validOrder(now), paymentStatus: 'paid' }))
    await assertFails(setDoc(doc(db, 'orders/SW-261108-AB234'), validOrder(now, 'bob', 'bob@example.com')))
    await assertFails(setDoc(doc(db, 'orders/SW-261108-AB234'), { ...validOrder(now), customerEmail: 'other@example.com' }))
    await assertFails(setDoc(doc(db, 'orders/SW-261108-AB234'), { ...validOrder(now), totalPaise: 1 }))
    await assertFails(setDoc(doc(db, 'orders/SW-261108-AB234'), { ...validOrder(now), items: [] }))
    await assertFails(setDoc(doc(db, 'orders/SW-261108-AB234'), { ...validOrder(now), consentAccepted: false }))
    await assertFails(setDoc(doc(db, 'orders/SW-261108-AB234'), { ...validOrder(now), adminNote: 'x' }))
    await assertFails(setDoc(doc(db, 'orders/SW-261108-AB234'), { ...validOrder(now), createdAt: new Date() }))
    await assertFails(setDoc(doc(db, 'orders/not-a-reference'), { ...validOrder(now), orderNumber: 'not-a-reference' }))
    await assertFails(setDoc(doc(db, 'orders/SW-261108-AB235'), validOrder(now)))
    await assertFails(setDoc(doc(db, 'orders/SW-261108-AB234'), {
      ...validOrder(now),
      shippingAddress: { ...validOrder(now).shippingAddress, pinCode: '12' },
    }))
  })

  it('guests cannot create orders', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertFails(setDoc(doc(db, 'orders/SW-261108-AB234'), validOrder(serverTimestamp())))
  })

  it('customers cannot update or delete orders, including their own', async () => {
    const db = env.authenticatedContext('alice', alice).firestore()
    await assertFails(updateDoc(doc(db, 'orders/SW-261108-ZZ999'), { paymentStatus: 'paid' }))
    await assertFails(updateDoc(doc(db, 'orders/SW-261108-ZZ999'), { totalPaise: 1 }))
    await assertFails(deleteDoc(doc(db, 'orders/SW-261108-ZZ999')))
  })

  it('an existing order cannot be overwritten by creating it again', async () => {
    const db = env.authenticatedContext('alice', alice).firestore()
    await assertFails(setDoc(doc(db, 'orders/SW-261108-ZZ999'), validOrder(serverTimestamp(), 'alice', 'alice@example.com', 'SW-261108-ZZ999')))
  })

  it('admin can approve with an amount and cannot skip steps or edit items', async () => {
    const db = env.authenticatedContext('owner', admin).firestore()
    const ref = doc(db, 'orders/SW-261108-ZZ999')
    await assertFails(updateDoc(ref, { orderStatus: 'delivered', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(ref, { orderStatus: 'approved_awaiting_payment', paymentStatus: 'awaiting_payment', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(ref, { items: [], updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(ref, { customerUid: 'bob', updatedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(ref, {
      orderStatus: 'approved_awaiting_payment',
      paymentStatus: 'awaiting_payment',
      shippingPaise: 5000,
      finalTotalPaise: 25000,
      stockDeducted: true,
      updatedAt: serverTimestamp(),
    }))
    await assertFails(deleteDoc(ref))
  })

  it('admin can walk an order through payment and fulfilment, but not skip safeguards', async () => {
    const db = env.authenticatedContext('owner', admin).firestore()
    const ref = doc(db, 'orders/SW-261108-ZZ999')
    await assertSucceeds(updateDoc(ref, {
      orderStatus: 'approved_awaiting_payment', paymentStatus: 'awaiting_payment',
      shippingPaise: 5000, finalTotalPaise: 25000, updatedAt: serverTimestamp(),
    }))
    await assertFails(updateDoc(ref, { orderStatus: 'payment_verified', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(ref, { paymentStatus: 'paid', updatedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(ref, { orderStatus: 'payment_verified', paymentStatus: 'paid', updatedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(ref, { orderStatus: 'processing', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(ref, { orderStatus: 'dispatched', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(ref, { orderStatus: 'dispatched', courierName: 'DTDC', trackingUrl: 'javascript:alert(1)', updatedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(ref, {
      orderStatus: 'dispatched', courierName: 'DTDC', trackingReference: 'D123',
      trackingUrl: 'https://example.com/track/D123', updatedAt: serverTimestamp(),
    }))
    await assertFails(updateDoc(ref, { orderStatus: 'cancelled', cancelReason: 'x', updatedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(ref, { orderStatus: 'delivered', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(ref, { orderStatus: 'processing', updatedAt: serverTimestamp() }))
  })

  it('cancelling needs a reason, and a refund can only follow a paid cancellation', async () => {
    const db = env.authenticatedContext('owner', admin).firestore()
    const ref = doc(db, 'orders/SW-261108-ZZ999')
    await assertSucceeds(updateDoc(ref, {
      orderStatus: 'approved_awaiting_payment', paymentStatus: 'awaiting_payment',
      shippingPaise: 0, finalTotalPaise: 20000, updatedAt: serverTimestamp(),
    }))
    await assertSucceeds(updateDoc(ref, { orderStatus: 'payment_verified', paymentStatus: 'paid', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(ref, { orderStatus: 'cancelled', updatedAt: serverTimestamp() }))
    await assertFails(updateDoc(ref, { paymentStatus: 'refunded', updatedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(ref, { orderStatus: 'cancelled', cancelReason: 'Out of material', stockReturned: true, updatedAt: serverTimestamp() }))
    await assertSucceeds(updateDoc(ref, { paymentStatus: 'refunded', updatedAt: serverTimestamp() }))
  })

  it('admin can read every order', async () => {
    const db = env.authenticatedContext('owner', admin).firestore()
    await assertSucceeds(getDoc(doc(db, 'orders/o1')))
    await assertSucceeds(getDocs(collection(db, 'orders')))
  })

  it('customers read only customer-visible events of their own orders', async () => {
    const aliceDb = env.authenticatedContext('alice', alice).firestore()
    const bobDb = env.authenticatedContext('bob', { email: 'bob@example.com' }).firestore()
    const path = 'orders/SW-261108-ZZ999/events'
    await assertSucceeds(getDoc(doc(aliceDb, `${path}/pub`)))
    await assertFails(getDoc(doc(aliceDb, `${path}/priv`)))
    await assertFails(getDoc(doc(bobDb, `${path}/pub`)))
    await assertSucceeds(getDocs(query(collection(aliceDb, path), where('customerUid', '==', 'alice'), where('visibility', '==', 'customer'))))
    await assertFails(getDocs(collection(aliceDb, path)))
  })

  it('only admin can create events, and events cannot be changed', async () => {
    const aliceDb = env.authenticatedContext('alice', alice).firestore()
    const adminDb = env.authenticatedContext('owner', admin).firestore()
    const event = { type: 'note', message: 'Hello', visibility: 'customer', customerUid: 'alice', actorUid: 'owner', createdAt: serverTimestamp() }
    await assertFails(setDoc(doc(aliceDb, 'orders/SW-261108-ZZ999/events/x1'), { ...event, actorUid: 'alice' }))
    await assertSucceeds(setDoc(doc(adminDb, 'orders/SW-261108-ZZ999/events/x2'), event))
    await assertFails(setDoc(doc(adminDb, 'orders/SW-261108-ZZ999/events/x3'), { ...event, customerUid: 'bob' }))
    await assertFails(updateDoc(doc(adminDb, 'orders/SW-261108-ZZ999/events/pub'), { message: 'edited' }))
    await assertFails(deleteDoc(doc(adminDb, 'orders/SW-261108-ZZ999/events/pub')))
  })

  it('only admin can record stock movements, and they cannot be changed', async () => {
    const aliceDb = env.authenticatedContext('alice', alice).firestore()
    const adminDb = env.authenticatedContext('owner', admin).firestore()
    const movement = { productId: 'pub', delta: -2, reason: 'order_approved', actorUid: 'owner', createdAt: serverTimestamp() }
    await assertFails(setDoc(doc(aliceDb, 'stockMovements/m1'), { ...movement, actorUid: 'alice' }))
    await assertSucceeds(setDoc(doc(adminDb, 'stockMovements/m1'), movement))
    await assertFails(updateDoc(doc(adminDb, 'stockMovements/m1'), { delta: 5 }))
    await assertFails(getDoc(doc(aliceDb, 'stockMovements/m1')))
  })
})

describe('settings and content', () => {
  it('settings are public to read, admin only to write', async () => {
    await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), 'settings/store')))
    await assertFails(setDoc(doc(env.authenticatedContext('alice', alice).firestore(), 'settings/store'), { storeName: 'Hacked' }))
    await assertSucceeds(setDoc(doc(env.authenticatedContext('owner', admin).firestore(), 'settings/store'), { storeName: 'Slimewali' }))
  })

  it('settings reject unknown keys, other documents and bad values', async () => {
    const db = env.authenticatedContext('owner', admin).firestore()
    await assertFails(setDoc(doc(db, 'settings/store'), { storeName: 'X', extra: 1 }))
    await assertFails(setDoc(doc(db, 'settings/other'), { storeName: 'X' }))
    await assertFails(setDoc(doc(db, 'settings/store'), { shippingMode: 'free-for-all' }))
    await assertFails(setDoc(doc(db, 'settings/store'), { flatShippingPaise: -1 }))
    await assertFails(setDoc(doc(db, 'settings/store'), { announcementText: 'x'.repeat(161) }))
    await assertSucceeds(setDoc(doc(db, 'settings/store'), { shippingMode: 'flat', flatShippingPaise: 6000, announcementActive: false }))
  })

  it('settings accept sale fields and reject bad ones', async () => {
    const db = env.authenticatedContext('owner', admin).firestore()
    await assertSucceeds(setDoc(doc(db, 'settings/store'), { saleActive: true, saleTitle: 'Diwali sale', saleText: 'Up to 30% off', saleEndsOn: '2026-12-31' }))
    await assertFails(setDoc(doc(db, 'settings/store'), { saleActive: 'yes' }))
    await assertFails(setDoc(doc(db, 'settings/store'), { saleTitle: 'x'.repeat(61) }))
    await assertFails(setDoc(doc(db, 'settings/store'), { saleEndsOn: '2026-12-31T00:00:00' }))
  })

  it('only published content is public', async () => {
    const db = env.unauthenticatedContext().firestore()
    await assertSucceeds(getDoc(doc(db, 'content/pages_live')))
    await assertFails(getDoc(doc(db, 'content/pages_draft')))
  })

  it('content is written by admins only, for known pages, with a valid shape', async () => {
    const page = { title: 'About us', body: 'Hello', items: [], isPublished: true }
    await assertFails(setDoc(doc(env.authenticatedContext('alice', alice).firestore(), 'content/about'), page))
    const db = env.authenticatedContext('owner', admin).firestore()
    await assertSucceeds(setDoc(doc(db, 'content/about'), page))
    await assertFails(setDoc(doc(db, 'content/random'), page))
    await assertFails(setDoc(doc(db, 'content/about'), { ...page, title: '' }))
    await assertFails(setDoc(doc(db, 'content/about'), { ...page, html: '<b>x</b>' }))
    await assertFails(setDoc(doc(db, 'content/about'), { ...page, isPublished: 'yes' }))
  })
})

describe('instagram handle', () => {
  it('orders accept a valid optional handle and reject a bad one', async () => {
    const db = env.authenticatedContext('alice', alice).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'orders/SW-261108-IG234'), {
        ...validOrder(serverTimestamp(), 'alice', 'alice@example.com', 'SW-261108-IG234'),
        customerInstagram: 'slime.fan_1',
      }),
    )
    await assertFails(
      setDoc(doc(db, 'orders/SW-261108-IG235'), {
        ...validOrder(serverTimestamp(), 'alice', 'alice@example.com', 'SW-261108-IG235'),
        customerInstagram: 'bad handle!',
      }),
    )
  })
})

describe('server-only collections', () => {
  it('counters and idempotency keys are closed to every client', async () => {
    const db = env.authenticatedContext('owner', admin).firestore()
    await assertFails(getDoc(doc(db, 'counters/orders')))
    await assertFails(setDoc(doc(db, 'counters/orders'), { value: 1 }))
    await assertFails(setDoc(doc(db, 'idempotencyKeys/k1'), { a: 1 }))
  })

  it('unknown collections are denied by default', async () => {
    const db = env.authenticatedContext('owner', admin).firestore()
    await assertFails(setDoc(doc(db, 'whatever/x'), { a: 1 }))
  })
})
