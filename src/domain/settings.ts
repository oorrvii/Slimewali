import { brand } from '@/config/brand'
import { INSTAGRAM_ERROR, normalizeInstagram, normalizePhone } from './address'
import { formatPaise } from './money'

export type ShippingMode = 'manual' | 'flat' | 'threshold'

export type StoreSettings = {
  storeName: string
  announcementText: string
  announcementActive: boolean
  supportEmail: string
  supportPhone: string
  whatsappNumber: string
  instagramHandle: string
  shippingMode: ShippingMode
  flatShippingPaise: number
  freeShippingThresholdPaise: number
  shippingNote: string
  heroEyebrow: string
  heroLine1: string
  heroLine2: string
  heroLine3: string
  heroSubheading: string
  textureTitle: string
  textureBody: string
  saleActive: boolean
  saleTitle: string
  saleText: string
  saleEndsOn: string
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: brand.storeName,
  announcementText: brand.announcement,
  announcementActive: true,
  supportEmail: '',
  supportPhone: '',
  whatsappNumber: '',
  instagramHandle: '',
  shippingMode: 'manual',
  flatShippingPaise: 0,
  freeShippingThresholdPaise: 0,
  shippingNote: '',
  heroEyebrow: brand.heroEyebrow,
  heroLine1: brand.heroLines[0],
  heroLine2: brand.heroLines[1],
  heroLine3: brand.heroLines[2],
  heroSubheading: brand.heroSubheading,
  textureTitle: brand.textureTitle,
  textureBody: brand.textureBody,
  saleActive: false,
  saleTitle: '',
  saleText: '',
  saleEndsOn: '',
}

export type SettingsErrors = Partial<Record<keyof StoreSettings, string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateSettings(input: StoreSettings): SettingsErrors {
  const errors: SettingsErrors = {}
  const max = (key: keyof StoreSettings, limit: number, label: string) => {
    const value = input[key]
    if (typeof value === 'string' && value.length > limit) errors[key] = `${label} must be ${limit} characters or fewer.`
  }
  if (!input.storeName.trim()) errors.storeName = 'Enter the shop name.'
  max('storeName', 60, 'The shop name')
  max('announcementText', 160, 'The announcement')
  if (input.announcementActive && !input.announcementText.trim()) {
    errors.announcementText = 'Write the announcement or turn the strip off.'
  }
  if (input.supportEmail.trim() && !EMAIL.test(input.supportEmail.trim())) {
    errors.supportEmail = 'Enter a valid email address.'
  }
  max('supportEmail', 120, 'The email')
  max('supportPhone', 20, 'The phone number')
  if (input.whatsappNumber.trim() && !normalizePhone(input.whatsappNumber)) {
    errors.whatsappNumber = 'Enter a valid 10-digit Indian mobile number.'
  }
  if (input.instagramHandle.trim() && normalizeInstagram(input.instagramHandle) === null) {
    errors.instagramHandle = INSTAGRAM_ERROR
  }
  if (input.flatShippingPaise < 0 || input.flatShippingPaise > 100000000) errors.flatShippingPaise = 'Enter a valid amount.'
  if (input.freeShippingThresholdPaise < 0 || input.freeShippingThresholdPaise > 1000000000) {
    errors.freeShippingThresholdPaise = 'Enter a valid amount.'
  }
  if (input.shippingMode === 'threshold' && input.freeShippingThresholdPaise <= 0) {
    errors.freeShippingThresholdPaise = 'Enter the order amount above which shipping is free.'
  }
  max('shippingNote', 300, 'The shipping note')
  max('heroEyebrow', 60, 'This line')
  max('heroLine1', 20, 'This word')
  max('heroLine2', 20, 'This word')
  max('heroLine3', 20, 'This word')
  max('heroSubheading', 240, 'The subheading')
  max('textureTitle', 80, 'The title')
  max('textureBody', 240, 'The text')
  max('saleTitle', 60, 'The sale title')
  max('saleText', 160, 'The sale text')
  if (input.saleEndsOn && !isValidDate(input.saleEndsOn)) errors.saleEndsOn = 'Pick a valid date.'
  if (input.saleActive && !input.saleTitle.trim()) errors.saleTitle = 'Write a title for the sale or turn it off.'
  return errors
}

export function cleanSettings(input: StoreSettings): StoreSettings {
  return {
    ...input,
    storeName: input.storeName.trim(),
    announcementText: input.announcementText.trim(),
    supportEmail: input.supportEmail.trim(),
    supportPhone: input.supportPhone.trim(),
    whatsappNumber: input.whatsappNumber.trim() ? (normalizePhone(input.whatsappNumber) ?? '') : '',
    instagramHandle: normalizeInstagram(input.instagramHandle) ?? '',
    shippingNote: input.shippingNote.trim(),
    heroEyebrow: input.heroEyebrow.trim(),
    heroLine1: input.heroLine1.trim(),
    heroLine2: input.heroLine2.trim(),
    heroLine3: input.heroLine3.trim(),
    heroSubheading: input.heroSubheading.trim(),
    textureTitle: input.textureTitle.trim(),
    textureBody: input.textureBody.trim(),
    saleTitle: input.saleTitle.trim(),
    saleText: input.saleText.trim(),
  }
}

export function suggestShippingPaise(settings: StoreSettings, subtotalPaise: number): number | null {
  if (settings.shippingMode === 'manual') return null
  if (settings.shippingMode === 'flat') return settings.flatShippingPaise
  return settings.freeShippingThresholdPaise > 0 && subtotalPaise >= settings.freeShippingThresholdPaise
    ? 0
    : settings.flatShippingPaise
}

export function shippingDescription(settings: StoreSettings): string {
  if (settings.shippingMode === 'flat') {
    return settings.flatShippingPaise === 0
      ? 'Free shipping, confirmed after review'
      : `Flat rate ${formatPaise(settings.flatShippingPaise)}, confirmed after review`
  }
  if (settings.shippingMode === 'threshold') {
    return `${formatPaise(settings.flatShippingPaise)} flat rate, free on orders of ${formatPaise(settings.freeShippingThresholdPaise)} or more. Confirmed after review`
  }
  return 'Confirmed after we review your order'
}

export function whatsappLink(number: string, text?: string): string | null {
  const phone = normalizePhone(number)
  if (!phone) return null
  const digits = phone.replace('+', '')
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function istDateString(now: Date): string {
  return new Date(now.getTime() + 330 * 60 * 1000).toISOString().slice(0, 10)
}

export function isSaleLive(settings: Pick<StoreSettings, 'saleActive' | 'saleTitle' | 'saleEndsOn'>, now: Date = new Date()): boolean {
  if (!settings.saleActive || !settings.saleTitle.trim()) return false
  if (!settings.saleEndsOn) return true
  return istDateString(now) <= settings.saleEndsOn
}