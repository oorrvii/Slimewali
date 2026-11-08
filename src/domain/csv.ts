import type { Order } from './order'

const HEADERS = [
  'Order number',
  'Placed at',
  'Status',
  'Payment',
  'Customer',
  'Email',
  'Phone',
  'Instagram',
  'Items',
  'Subtotal (INR)',
  'Shipping (INR)',
  'Final total (INR)',
  'Address',
  'Courier',
  'Tracking',
  'Customer note',
  'Admin note',
]

export function csvCell(value: string | number): string {
  let text = String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function rupees(paise: number | null): string {
  return paise === null ? '' : (paise / 100).toFixed(2)
}

export function ordersToCsv(orders: Order[]): string {
  const rows = orders.map((order) => {
    const address = order.shippingAddress
    return [
      order.orderNumber,
      order.createdAtMs ? new Date(order.createdAtMs).toISOString() : '',
      order.orderStatus,
      order.paymentStatus,
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.customerInstagram,
      order.items.map((item) => `${item.quantity} x ${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ''}`).join('; '),
      rupees(order.subtotalPaise),
      rupees(order.shippingPaise),
      rupees(order.finalTotalPaise),
      [address.line1, address.line2, address.landmark, address.city, address.state, address.pinCode].filter(Boolean).join(', '),
      order.courierName,
      order.trackingReference,
      order.note,
      order.adminNote,
    ]
  })
  return [HEADERS, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
}
