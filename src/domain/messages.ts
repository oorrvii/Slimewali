import { formatPaise } from './money'
import type { Order } from './order'
import type { OrderStatus } from './status'
import { whatsappLink, type StoreSettings } from './settings'

export type MessageKind = 'approved' | 'payment_received' | 'processing' | 'dispatched' | 'delivered' | 'rejected' | 'cancelled' | 'general'

export const MESSAGE_KINDS: { id: MessageKind; label: string }[] = [
  { id: 'approved', label: 'Order approved, payment details' },
  { id: 'payment_received', label: 'Payment received' },
  { id: 'processing', label: 'Order being prepared' },
  { id: 'dispatched', label: 'Order dispatched' },
  { id: 'delivered', label: 'Order delivered' },
  { id: 'rejected', label: 'Request not accepted' },
  { id: 'cancelled', label: 'Order cancelled' },
  { id: 'general', label: 'Custom message' },
]

export const PAYMENT_PLACEHOLDER = '[Add your payment details here]'

export function defaultKindFor(status: OrderStatus): MessageKind {
  switch (status) {
    case 'approved_awaiting_payment':
      return 'approved'
    case 'payment_verified':
      return 'payment_received'
    case 'processing':
      return 'processing'
    case 'dispatched':
      return 'dispatched'
    case 'delivered':
      return 'delivered'
    case 'rejected':
      return 'rejected'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'general'
  }
}

export function buildMessage(kind: MessageKind, order: Order, settings: StoreSettings): string {
  const name = order.customerName.split(' ')[0] || 'there'
  const ref = order.orderNumber
  const total = formatPaise(order.finalTotalPaise ?? order.totalPaise)
  const sign = `Thank you,\n${settings.storeName}`
  switch (kind) {
    case 'approved':
      return `Hi ${name}, your order ${ref} is approved. The total is ${total}.\n\nTo pay:\n${PAYMENT_PLACEHOLDER}\n\nPlease reply here with your payment confirmation and mention ${ref}. We will confirm once we have verified it.\n\n${sign}`
    case 'payment_received':
      return `Hi ${name}, we have received and verified your payment for order ${ref}. We will start preparing it now.\n\n${sign}`
    case 'processing':
      return `Hi ${name}, your order ${ref} is being prepared.\n\n${sign}`
    case 'dispatched': {
      const lines = [`Hi ${name}, your order ${ref} has been dispatched.`]
      if (order.courierName) lines.push(`Courier: ${order.courierName}`)
      if (order.trackingReference) lines.push(`Tracking number: ${order.trackingReference}`)
      if (order.trackingUrl) lines.push(`Track it here: ${order.trackingUrl}`)
      return `${lines.join('\n')}\n\n${sign}`
    }
    case 'delivered':
      return `Hi ${name}, your order ${ref} is marked as delivered. If anything is wrong, please reply to this message.\n\n${sign}`
    case 'rejected':
      return `Hi ${name}, we are sorry, we could not accept your order request ${ref}.${order.customerVisibleNote ? `\n\n${order.customerVisibleNote}` : ''}\n\n${sign}`
    case 'cancelled':
      return `Hi ${name}, your order ${ref} has been cancelled.${order.cancelReason ? `\nReason: ${order.cancelReason}` : ''}\n\n${sign}`
    default:
      return `Hi ${name}, this is about your order ${ref}.\n\n${sign}`
  }
}

export function hasUnfilledPlaceholder(text: string): boolean {
  return text.includes(PAYMENT_PLACEHOLDER)
}

export function messageLinks(order: Order, text: string) {
  const subject = `Your order ${order.orderNumber}`
  return {
    whatsapp: whatsappLink(order.customerPhone, text),
    email: order.customerEmail
      ? `mailto:${order.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
      : null,
    instagram: order.customerInstagram ? `https://instagram.com/${order.customerInstagram}` : null,
  }
}