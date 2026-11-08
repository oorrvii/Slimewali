import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { requireServices } from './firebase'
import { ApprovalBlockedError, OrderStateError } from './errors'
import { cleanAddress, type AddressInput } from '@/domain/address'
import {
  checkLineForApproval,
  itemsCount,
  itemsSubtotal,
  type Order,
  type OrderEvent,
  type OrderItem,
  type ShippingAddress,
} from '@/domain/order'
import type { ContactStatus, OrderStatus, PaymentStatus } from '@/domain/status'

const LIST_LIMIT = 200

function millis(value: unknown): number {
  const candidate = value as { toMillis?: () => number } | null
  return candidate && typeof candidate.toMillis === 'function' ? candidate.toMillis() : 0
}

function toItem(raw: DocumentData): OrderItem {
  return {
    productId: String(raw.productId ?? ''),
    variantId: typeof raw.variantId === 'string' ? raw.variantId : null,
    name: String(raw.name ?? ''),
    slug: String(raw.slug ?? ''),
    variantLabel: String(raw.variantLabel ?? ''),
    quantity: Number.isInteger(raw.quantity) ? raw.quantity : 0,
    unitPaise: Number.isInteger(raw.unitPaise) ? raw.unitPaise : 0,
    lineTotalPaise: Number.isInteger(raw.lineTotalPaise) ? raw.lineTotalPaise : 0,
    imagePath: typeof raw.imagePath === 'string' ? raw.imagePath : null,
  }
}

function toShipping(raw: DocumentData | undefined): ShippingAddress {
  const data = raw ?? {}
  return {
    fullName: String(data.fullName ?? ''),
    phone: String(data.phone ?? ''),
    line1: String(data.line1 ?? ''),
    line2: String(data.line2 ?? ''),
    landmark: String(data.landmark ?? ''),
    city: String(data.city ?? ''),
    state: String(data.state ?? ''),
    pinCode: String(data.pinCode ?? ''),
    country: 'India',
  }
}

function toOrder(id: string, data: DocumentData): Order {
  return {
    id,
    orderNumber: String(data.orderNumber ?? id),
    customerUid: String(data.customerUid ?? ''),
    customerName: String(data.customerName ?? ''),
    customerEmail: String(data.customerEmail ?? ''),
    customerPhone: String(data.customerPhone ?? ''),
    customerInstagram: String(data.customerInstagram ?? ''),
    shippingAddress: toShipping(data.shippingAddress),
    note: String(data.note ?? ''),
    items: Array.isArray(data.items) ? data.items.map((item) => toItem(item as DocumentData)) : [],
    itemCount: Number.isInteger(data.itemCount) ? data.itemCount : 0,
    subtotalPaise: Number.isInteger(data.subtotalPaise) ? data.subtotalPaise : 0,
    shippingPaise: Number.isInteger(data.shippingPaise) ? data.shippingPaise : null,
    totalPaise: Number.isInteger(data.totalPaise) ? data.totalPaise : 0,
    finalTotalPaise: Number.isInteger(data.finalTotalPaise) ? data.finalTotalPaise : null,
    totalChangeReason: String(data.totalChangeReason ?? ''),
    orderStatus: data.orderStatus as OrderStatus,
    paymentStatus: data.paymentStatus as PaymentStatus,
    contactStatus: data.contactStatus as ContactStatus,
    adminNote: String(data.adminNote ?? ''),
    customerVisibleNote: String(data.customerVisibleNote ?? ''),
    stockDeducted: data.stockDeducted === true,
    stockReturned: data.stockReturned === true,
    courierName: String(data.courierName ?? ''),
    trackingReference: String(data.trackingReference ?? ''),
    trackingUrl: String(data.trackingUrl ?? ''),
    cancelReason: String(data.cancelReason ?? ''),
    createdAtMs: millis(data.createdAt),
    updatedAtMs: millis(data.updatedAt),
  }
}

function toEvent(id: string, data: DocumentData): OrderEvent {
  return {
    id,
    type: String(data.type ?? ''),
    message: String(data.message ?? ''),
    visibility: data.visibility === 'internal' ? 'internal' : 'customer',
    fromStatus: String(data.fromStatus ?? ''),
    toStatus: String(data.toStatus ?? ''),
    actorUid: String(data.actorUid ?? ''),
    createdAtMs: millis(data.createdAt),
  }
}

export async function createOrder(input: {
  orderId: string
  uid: string
  email: string
  address: AddressInput
  note: string
  instagram: string
  items: OrderItem[]
}): Promise<void> {
  const { db } = requireServices()
  const address = cleanAddress(input.address)
  const subtotal = itemsSubtotal(input.items)
  const shipping: Record<string, string> = {
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    city: address.city,
    state: address.state,
    pinCode: address.pinCode,
    country: 'India',
  }
  if (address.line2) shipping.line2 = address.line2
  if (address.landmark) shipping.landmark = address.landmark

  const data: Record<string, unknown> = {
    orderNumber: input.orderId,
    customerUid: input.uid,
    customerName: address.fullName,
    customerEmail: input.email,
    customerPhone: address.phone,
    shippingAddress: shipping,
    items: input.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      slug: item.slug,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      unitPaise: item.unitPaise,
      lineTotalPaise: item.unitPaise * item.quantity,
      imagePath: item.imagePath,
    })),
    itemCount: itemsCount(input.items),
    subtotalPaise: subtotal,
    totalPaise: subtotal,
    orderStatus: 'pending_review',
    paymentStatus: 'not_requested',
    contactStatus: 'not_contacted',
    consentAccepted: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const note = input.note.trim()
  if (note) data.note = note
  if (input.instagram) data.customerInstagram = input.instagram

  const ref = doc(db, 'orders', input.orderId)
  try {
    await setDoc(ref, data)
  } catch (error) {
    const existing = await getDoc(ref).catch(() => null)
    if (existing && existing.exists() && existing.data().customerUid === input.uid) return
    throw error
  }
}

export async function getMyOrder(orderId: string): Promise<Order | null> {
  const { db } = requireServices()
  try {
    const snapshot = await getDoc(doc(db, 'orders', orderId))
    return snapshot.exists() ? toOrder(snapshot.id, snapshot.data()) : null
  } catch {
    return null
  }
}

export async function listMyOrders(uid: string): Promise<Order[]> {
  const { db } = requireServices()
  const snapshot = await getDocs(
    query(
      collection(db, 'orders'),
      where('customerUid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(LIST_LIMIT),
    ),
  )
  return snapshot.docs.map((item) => toOrder(item.id, item.data()))
}

export async function listCustomerEvents(orderId: string, uid: string): Promise<OrderEvent[]> {
  const { db } = requireServices()
  const snapshot = await getDocs(
    query(
      collection(db, 'orders', orderId, 'events'),
      where('customerUid', '==', uid),
      where('visibility', '==', 'customer'),
    ),
  )
  return snapshot.docs.map((item) => toEvent(item.id, item.data())).sort((a, b) => a.createdAtMs - b.createdAtMs)
}

export async function listOrdersAdmin(): Promise<Order[]> {
  const { db } = requireServices()
  const snapshot = await getDocs(
    query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(LIST_LIMIT)),
  )
  return snapshot.docs.map((item) => toOrder(item.id, item.data()))
}

export async function getOrderAdmin(orderId: string): Promise<Order | null> {
  const { db } = requireServices()
  const snapshot = await getDoc(doc(db, 'orders', orderId))
  return snapshot.exists() ? toOrder(snapshot.id, snapshot.data()) : null
}

export async function listEventsAdmin(orderId: string): Promise<OrderEvent[]> {
  const { db } = requireServices()
  const snapshot = await getDocs(query(collection(db, 'orders', orderId, 'events'), orderBy('createdAt', 'asc')))
  return snapshot.docs.map((item) => toEvent(item.id, item.data()))
}

type EventInput = {
  type: string
  message: string
  visibility: 'customer' | 'internal'
  fromStatus?: string
  toStatus?: string
  customerUid: string
  actorUid: string
}

function eventData(input: EventInput): Record<string, unknown> {
  const data: Record<string, unknown> = {
    type: input.type,
    message: input.message,
    visibility: input.visibility,
    customerUid: input.customerUid,
    actorUid: input.actorUid,
    createdAt: serverTimestamp(),
  }
  if (input.fromStatus) data.fromStatus = input.fromStatus
  if (input.toStatus) data.toStatus = input.toStatus
  return data
}

export async function approveOrder(
  order: Order,
  input: {
    shippingPaise: number
    finalTotalPaise: number
    reason: string
    customerVisibleNote: string
    actorUid: string
  },
): Promise<void> {
  const { db } = requireServices()
  const orderRef = doc(db, 'orders', order.id)
  const productIds = Array.from(new Set(order.items.map((item) => item.productId)))

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef)
    if (!orderSnapshot.exists()) throw new OrderStateError('This order no longer exists.')
    const current = orderSnapshot.data()
    if (current.orderStatus !== 'pending_review' || current.stockDeducted === true) {
      throw new OrderStateError('This order was already handled. Reload to see its latest state.')
    }

    const snapshots = new Map<string, DocumentData | null>()
    for (const id of productIds) {
      const productSnapshot = await transaction.get(doc(db, 'products', id))
      snapshots.set(id, productSnapshot.exists() ? productSnapshot.data() : null)
    }

    const issues: string[] = []
    order.items.forEach((item) => {
      const data = snapshots.get(item.productId) ?? null
      const checked = checkLineForApproval(
        item,
        data
          ? {
              status: String(data.status ?? 'draft'),
              hasVariants: data.hasVariants === true,
              pricePaise: Number.isInteger(data.pricePaise) ? data.pricePaise : 0,
              stockQuantity: Number.isInteger(data.stockQuantity) ? data.stockQuantity : 0,
              variants: Array.isArray(data.variants)
                ? data.variants.map((variant: DocumentData) => ({
                    id: String(variant.id ?? ''),
                    pricePaise: Number.isInteger(variant.pricePaise) ? variant.pricePaise : 0,
                    stockQuantity: Number.isInteger(variant.stockQuantity) ? variant.stockQuantity : 0,
                    isActive: variant.isActive !== false,
                  }))
                : [],
            }
          : null,
      )
      if (checked.issue) issues.push(`${item.name}: ${checked.issue}`)
    })

    const demand = new Map<string, number>()
    for (const item of order.items) {
      const key = `${item.productId}::${item.variantId ?? ''}`
      demand.set(key, (demand.get(key) ?? 0) + item.quantity)
    }
    for (const item of order.items) {
      const data = snapshots.get(item.productId)
      if (!data) continue
      const need = demand.get(`${item.productId}::${item.variantId ?? ''}`) ?? 0
      if (data.hasVariants === true) {
        const variant = (Array.isArray(data.variants) ? data.variants : []).find(
          (entry: DocumentData) => entry.id === item.variantId,
        )
        if (variant && Number.isInteger(variant.stockQuantity) && variant.stockQuantity < need) {
          const message = `${item.name}: only ${variant.stockQuantity} in stock for ${need} ordered.`
          if (!issues.includes(message)) issues.push(message)
        }
      } else if (Number.isInteger(data.stockQuantity) && data.stockQuantity < need) {
        const message = `${item.name}: only ${data.stockQuantity} in stock for ${need} ordered.`
        if (!issues.includes(message)) issues.push(message)
      }
    }
    if (issues.length > 0) throw new ApprovalBlockedError(issues)

    for (const id of productIds) {
      const data = snapshots.get(id) as DocumentData
      const lines = order.items.filter((item) => item.productId === id)
      const changes: Record<string, unknown> = { updatedAt: serverTimestamp(), updatedBy: input.actorUid }
      if (data.hasVariants === true) {
        changes.variants = (data.variants as DocumentData[]).map((variant) => {
          const sold = lines
            .filter((item) => item.variantId === variant.id)
            .reduce((sum, item) => sum + item.quantity, 0)
          return sold > 0 ? { ...variant, stockQuantity: variant.stockQuantity - sold } : variant
        })
      } else {
        changes.stockQuantity = data.stockQuantity - lines.reduce((sum, item) => sum + item.quantity, 0)
      }
      transaction.update(doc(db, 'products', id), changes)
    }

    for (const item of order.items) {
      transaction.set(doc(collection(db, 'stockMovements')), {
        productId: item.productId,
        ...(item.variantId ? { variantId: item.variantId } : {}),
        delta: -item.quantity,
        reason: 'order_approved',
        orderId: order.id,
        actorUid: input.actorUid,
        createdAt: serverTimestamp(),
      })
    }

    transaction.update(orderRef, {
      orderStatus: 'approved_awaiting_payment',
      paymentStatus: 'awaiting_payment',
      shippingPaise: input.shippingPaise,
      finalTotalPaise: input.finalTotalPaise,
      totalChangeReason: input.reason.trim(),
      customerVisibleNote: input.customerVisibleNote.trim(),
      stockDeducted: true,
      updatedAt: serverTimestamp(),
    })

    transaction.set(
      doc(collection(db, 'orders', order.id, 'events')),
      eventData({
        type: 'approved',
        message: 'Order request approved. Payment details will be sent to you by message.',
        visibility: 'customer',
        fromStatus: 'pending_review',
        toStatus: 'approved_awaiting_payment',
        customerUid: order.customerUid,
        actorUid: input.actorUid,
      }),
    )
    if (input.reason.trim()) {
      transaction.set(
        doc(collection(db, 'orders', order.id, 'events')),
        eventData({
          type: 'total_changed',
          message: `Final total set to a different amount than items plus shipping: ${input.reason.trim()}`,
          visibility: 'internal',
          customerUid: order.customerUid,
          actorUid: input.actorUid,
        }),
      )
    }
  })
}

export async function rejectOrder(
  order: Order,
  input: { customerVisibleNote: string; internalNote: string; actorUid: string },
): Promise<void> {
  const { db } = requireServices()
  const orderRef = doc(db, 'orders', order.id)
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(orderRef)
    if (!snapshot.exists() || snapshot.data().orderStatus !== 'pending_review') {
      throw new OrderStateError('This order was already handled. Reload to see its latest state.')
    }
    transaction.update(orderRef, {
      orderStatus: 'rejected',
      customerVisibleNote: input.customerVisibleNote.trim(),
      adminNote: input.internalNote.trim() || String(snapshot.data().adminNote ?? ''),
      updatedAt: serverTimestamp(),
    })
    transaction.set(
      doc(collection(db, 'orders', order.id, 'events')),
      eventData({
        type: 'rejected',
        message: 'Order request not accepted.',
        visibility: 'customer',
        fromStatus: 'pending_review',
        toStatus: 'rejected',
        customerUid: order.customerUid,
        actorUid: input.actorUid,
      }),
    )
  })
}

export async function saveOrderNotes(
  order: Order,
  input: { adminNote: string; customerVisibleNote: string; actorUid: string },
): Promise<void> {
  const { db } = requireServices()
  const batch = writeBatch(db)
  batch.update(doc(db, 'orders', order.id), {
    adminNote: input.adminNote.trim(),
    customerVisibleNote: input.customerVisibleNote.trim(),
    updatedAt: serverTimestamp(),
  })
  if (input.customerVisibleNote.trim() !== order.customerVisibleNote) {
    batch.set(
      doc(collection(db, 'orders', order.id, 'events')),
      eventData({
        type: 'note',
        message: input.customerVisibleNote.trim() || 'A note was removed.',
        visibility: 'customer',
        customerUid: order.customerUid,
        actorUid: input.actorUid,
      }),
    )
  }
  await batch.commit()
}


type Transition = {
  expectedStatus: OrderStatus
  changes: Record<string, unknown>
  events: Array<Omit<EventInput, 'customerUid' | 'actorUid'>>
}

async function applyTransition(order: Order, actorUid: string, transition: Transition): Promise<void> {
  const { db } = requireServices()
  const orderRef = doc(db, 'orders', order.id)
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(orderRef)
    if (!snapshot.exists() || snapshot.data().orderStatus !== transition.expectedStatus) {
      throw new OrderStateError('This order changed in the meantime. Reload to see its latest state.')
    }
    transaction.update(orderRef, { ...transition.changes, updatedAt: serverTimestamp() })
    for (const event of transition.events) {
      transaction.set(
        doc(collection(db, 'orders', order.id, 'events')),
        eventData({ ...event, customerUid: order.customerUid, actorUid }),
      )
    }
  })
}

export async function recordContact(
  order: Order,
  input: { method: string; outcome: string; actorUid: string },
): Promise<void> {
  const { db } = requireServices()
  const batch = writeBatch(db)
  if (order.contactStatus === 'not_contacted') {
    batch.update(doc(db, 'orders', order.id), { contactStatus: 'contact_attempted', updatedAt: serverTimestamp() })
  } else {
    batch.update(doc(db, 'orders', order.id), { updatedAt: serverTimestamp() })
  }
  batch.set(
    doc(collection(db, 'orders', order.id, 'events')),
    eventData({
      type: 'contact',
      message: `Contact recorded (${input.method}): ${input.outcome.trim() || 'no details'}`,
      visibility: 'internal',
      customerUid: order.customerUid,
      actorUid: input.actorUid,
    }),
  )
  await batch.commit()
}

export async function markPaymentInstructionsSent(order: Order, actorUid: string): Promise<void> {
  const { db } = requireServices()
  const batch = writeBatch(db)
  batch.update(doc(db, 'orders', order.id), {
    contactStatus: 'payment_instructions_sent',
    updatedAt: serverTimestamp(),
  })
  batch.set(
    doc(collection(db, 'orders', order.id, 'events')),
    eventData({
      type: 'payment_instructions_sent',
      message: 'We have sent you payment instructions by message.',
      visibility: 'customer',
      customerUid: order.customerUid,
      actorUid,
    }),
  )
  await batch.commit()
}

export async function verifyPayment(order: Order, input: { reference: string; actorUid: string }): Promise<void> {
  const events: Transition['events'] = [
    {
      type: 'payment_verified',
      message: 'Payment verified. We will start preparing your order.',
      visibility: 'customer',
      fromStatus: 'approved_awaiting_payment',
      toStatus: 'payment_verified',
    },
  ]
  if (input.reference.trim()) {
    events.push({
      type: 'payment_reference',
      message: `Payment reference noted: ${input.reference.trim()}`,
      visibility: 'internal',
    })
  }
  await applyTransition(order, input.actorUid, {
    expectedStatus: 'approved_awaiting_payment',
    changes: { orderStatus: 'payment_verified', paymentStatus: 'paid' },
    events,
  })
}

export async function startProcessing(order: Order, actorUid: string): Promise<void> {
  await applyTransition(order, actorUid, {
    expectedStatus: 'payment_verified',
    changes: { orderStatus: 'processing' },
    events: [
      {
        type: 'processing',
        message: 'We are preparing your order.',
        visibility: 'customer',
        fromStatus: 'payment_verified',
        toStatus: 'processing',
      },
    ],
  })
}

export async function markDispatched(
  order: Order,
  input: { courierName: string; trackingReference: string; trackingUrl: string; actorUid: string },
): Promise<void> {
  const tracking = input.trackingReference.trim()
  await applyTransition(order, input.actorUid, {
    expectedStatus: 'processing',
    changes: {
      orderStatus: 'dispatched',
      courierName: input.courierName.trim(),
      trackingReference: tracking,
      trackingUrl: input.trackingUrl.trim(),
    },
    events: [
      {
        type: 'dispatched',
        message: `Your order has been dispatched with ${input.courierName.trim()}${tracking ? `. Tracking: ${tracking}` : ''}.`,
        visibility: 'customer',
        fromStatus: 'processing',
        toStatus: 'dispatched',
      },
    ],
  })
}

export async function markDelivered(order: Order, actorUid: string): Promise<void> {
  await applyTransition(order, actorUid, {
    expectedStatus: 'dispatched',
    changes: { orderStatus: 'delivered' },
    events: [
      {
        type: 'delivered',
        message: 'Your order has been delivered.',
        visibility: 'customer',
        fromStatus: 'dispatched',
        toStatus: 'delivered',
      },
    ],
  })
}

export async function markRefunded(order: Order, actorUid: string): Promise<void> {
  const { db } = requireServices()
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, 'orders', order.id)
    const snapshot = await transaction.get(ref)
    const data = snapshot.data()
    if (!data || data.orderStatus !== 'cancelled' || data.paymentStatus !== 'paid') {
      throw new OrderStateError('This order changed in the meantime. Reload to see its latest state.')
    }
    transaction.update(ref, { paymentStatus: 'refunded', updatedAt: serverTimestamp() })
    transaction.set(
      doc(collection(db, 'orders', order.id, 'events')),
      eventData({
        type: 'refunded',
        message: 'A refund for this order has been recorded.',
        visibility: 'customer',
        customerUid: order.customerUid,
        actorUid,
      }),
    )
  })
}

export async function cancelOrder(
  order: Order,
  input: { reason: string; returnStock: boolean; actorUid: string },
): Promise<void> {
  const { db } = requireServices()
  const orderRef = doc(db, 'orders', order.id)
  const productIds = Array.from(new Set(order.items.map((item) => item.productId)))

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(orderRef)
    const current = snapshot.data()
    if (!current || !['pending_review', 'approved_awaiting_payment', 'payment_verified', 'processing'].includes(current.orderStatus)) {
      throw new OrderStateError('This order can no longer be cancelled. Reload to see its latest state.')
    }
    const status = current.orderStatus as OrderStatus
    const restock = input.returnStock && current.stockDeducted === true && current.stockReturned !== true

    const products = new Map<string, DocumentData | null>()
    if (restock) {
      for (const id of productIds) {
        const productSnapshot = await transaction.get(doc(db, 'products', id))
        products.set(id, productSnapshot.exists() ? productSnapshot.data() : null)
      }
    }

    if (restock) {
      for (const id of productIds) {
        const data = products.get(id)
        if (!data) continue
        const lines = order.items.filter((item) => item.productId === id)
        const changes: Record<string, unknown> = { updatedAt: serverTimestamp(), updatedBy: input.actorUid }
        if (data.hasVariants === true) {
          changes.variants = (data.variants as DocumentData[]).map((variant) => {
            const back = lines
              .filter((item) => item.variantId === variant.id)
              .reduce((sum, item) => sum + item.quantity, 0)
            return back > 0 ? { ...variant, stockQuantity: variant.stockQuantity + back } : variant
          })
        } else {
          changes.stockQuantity = data.stockQuantity + lines.reduce((sum, item) => sum + item.quantity, 0)
        }
        transaction.update(doc(db, 'products', id), changes)
        for (const item of lines) {
          transaction.set(doc(collection(db, 'stockMovements')), {
            productId: item.productId,
            ...(item.variantId ? { variantId: item.variantId } : {}),
            delta: item.quantity,
            reason: 'order_cancelled',
            orderId: order.id,
            actorUid: input.actorUid,
            createdAt: serverTimestamp(),
          })
        }
      }
    }

    const changes: Record<string, unknown> = {
      orderStatus: 'cancelled',
      cancelReason: input.reason.trim(),
      updatedAt: serverTimestamp(),
    }
    if (current.paymentStatus === 'awaiting_payment') changes.paymentStatus = 'not_requested'
    if (restock) changes.stockReturned = true
    transaction.update(orderRef, changes)

    transaction.set(
      doc(collection(db, 'orders', order.id, 'events')),
      eventData({
        type: 'cancelled',
        message: `Order cancelled: ${input.reason.trim()}`,
        visibility: 'customer',
        fromStatus: status,
        toStatus: 'cancelled',
        customerUid: order.customerUid,
        actorUid: input.actorUid,
      }),
    )
  })
}
