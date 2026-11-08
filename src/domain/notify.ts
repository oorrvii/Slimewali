import { formatPaise } from './money'
import type { OrderItem } from './order'

export type AlertInput = {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerInstagram: string
  city: string
  state: string
  items: OrderItem[]
  subtotalPaise: number
  origin: string
}

export function buildAlertParams(input: AlertInput): Record<string, string> {
  const items = input.items
    .map((item) => `${item.quantity} x ${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ''} - ${formatPaise(item.unitPaise * item.quantity)}`)
    .join('\n')
  return {
    order_number: input.orderNumber,
    customer_name: input.customerName,
    customer_email: input.customerEmail,
    customer_phone: input.customerPhone,
    customer_instagram: input.customerInstagram ? `@${input.customerInstagram}` : 'not given',
    customer_place: `${input.city}, ${input.state}`,
    items,
    subtotal: formatPaise(input.subtotalPaise),
    admin_link: `${input.origin}/admin/orders/${input.orderNumber}`,
  }
}
