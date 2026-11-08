const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export const MAX_PRICE_PAISE = 100_000_000

export function formatPaise(paise: number): string {
  if (!Number.isInteger(paise)) {
    throw new Error('Money must be an integer number of paise')
  }
  return inrFormatter.format(paise / 100)
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

export function parseRupeesToPaise(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  const [whole, fraction = ''] = cleaned.split('.')
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(paise) || paise > MAX_PRICE_PAISE) return null
  return paise
}

export function paiseToInput(paise: number | undefined): string {
  if (paise === undefined) return ''
  const whole = Math.floor(paise / 100)
  const fraction = paise % 100
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, '0')}`
}
