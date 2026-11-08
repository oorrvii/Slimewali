export type OrderStatus =
  | 'pending_review'
  | 'approved_awaiting_payment'
  | 'rejected'
  | 'payment_verified'
  | 'processing'
  | 'dispatched'
  | 'delivered'
  | 'cancelled'

export type PaymentStatus =
  | 'not_requested'
  | 'awaiting_payment'
  | 'paid'
  | 'refunded'
  | 'payment_issue'

export type ContactStatus = 'not_contacted' | 'contact_attempted' | 'payment_instructions_sent'

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending_review: 'Order request received',
  approved_awaiting_payment: 'Approved — payment pending',
  rejected: 'Request not accepted',
  payment_verified: 'Payment verified',
  processing: 'Processing',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const orderStatusTone: Record<OrderStatus, 'lime' | 'lavender' | 'orange' | 'char' | 'outline'> = {
  pending_review: 'outline',
  approved_awaiting_payment: 'orange',
  rejected: 'char',
  payment_verified: 'lime',
  processing: 'lavender',
  dispatched: 'lavender',
  delivered: 'lime',
  cancelled: 'char',
}

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  not_requested: 'Payment not requested yet',
  awaiting_payment: 'Awaiting payment',
  paid: 'Payment verified',
  refunded: 'Refunded',
  payment_issue: 'Payment needs attention',
}

export const contactStatusLabel: Record<ContactStatus, string> = {
  not_contacted: 'Not contacted yet',
  contact_attempted: 'Contact attempted',
  payment_instructions_sent: 'Payment instructions sent',
}

export const orderStatusNextStep: Record<OrderStatus, string> = {
  pending_review: 'We are reviewing your request. We will contact you using the details you gave us.',
  approved_awaiting_payment:
    'Your request is approved. We will send you the payment details by message. Please do not pay anyone else.',
  rejected: 'We could not accept this request. See the note from us below.',
  payment_verified: 'We have confirmed your payment. We will start preparing your order.',
  processing: 'We are preparing your order.',
  dispatched: 'Your order is on its way.',
  delivered: 'Your order has been delivered.',
  cancelled: 'This order was cancelled.',
}

export const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending_review: ['approved_awaiting_payment', 'rejected', 'cancelled'],
  approved_awaiting_payment: ['payment_verified', 'cancelled'],
  rejected: [],
  payment_verified: ['processing', 'cancelled'],
  processing: ['dispatched', 'cancelled'],
  dispatched: ['delivered'],
  delivered: [],
  cancelled: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return allowedTransitions[from].includes(to)
}

export const ORDER_STATUSES = Object.keys(orderStatusLabel) as OrderStatus[]
