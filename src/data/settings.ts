import { doc, getDoc, serverTimestamp, setDoc, type DocumentData } from 'firebase/firestore'
import { firebaseConfigured, requireServices } from './firebase'
import {
  DEFAULT_SETTINGS,
  cleanSettings,
  type ShippingMode,
  type StoreSettings,
} from '@/domain/settings'

function text(data: DocumentData, key: keyof StoreSettings): string {
  const value = data[key]
  return typeof value === 'string' ? value : String(DEFAULT_SETTINGS[key])
}

function amount(data: DocumentData, key: keyof StoreSettings): number {
  const value = data[key]
  return Number.isInteger(value) && value >= 0 ? value : Number(DEFAULT_SETTINGS[key])
}

function toSettings(data: DocumentData): StoreSettings {
  const mode = data.shippingMode
  return {
    storeName: text(data, 'storeName') || DEFAULT_SETTINGS.storeName,
    announcementText: text(data, 'announcementText'),
    announcementActive:
      typeof data.announcementActive === 'boolean' ? data.announcementActive : DEFAULT_SETTINGS.announcementActive,
    supportEmail: text(data, 'supportEmail'),
    supportPhone: text(data, 'supportPhone'),
    whatsappNumber: text(data, 'whatsappNumber'),
    instagramHandle: text(data, 'instagramHandle'),
    shippingMode: (['manual', 'flat', 'threshold'] as ShippingMode[]).includes(mode) ? mode : 'manual',
    flatShippingPaise: amount(data, 'flatShippingPaise'),
    freeShippingThresholdPaise: amount(data, 'freeShippingThresholdPaise'),
    shippingNote: text(data, 'shippingNote'),
    heroEyebrow: text(data, 'heroEyebrow'),
    heroLine1: text(data, 'heroLine1'),
    heroLine2: text(data, 'heroLine2'),
    heroLine3: text(data, 'heroLine3'),
    heroSubheading: text(data, 'heroSubheading'),
    textureTitle: text(data, 'textureTitle'),
    textureBody: text(data, 'textureBody'),
    saleActive: data.saleActive === true,
    saleTitle: text(data, 'saleTitle'),
    saleText: text(data, 'saleText'),
    saleEndsOn: text(data, 'saleEndsOn'),
  }
}

export async function getSettings(): Promise<StoreSettings> {
  if (!firebaseConfigured) return DEFAULT_SETTINGS
  try {
    const { db } = requireServices()
    const snapshot = await getDoc(doc(db, 'settings', 'store'))
    return snapshot.exists() ? toSettings(snapshot.data()) : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export async function saveSettings(input: StoreSettings, actorUid: string): Promise<void> {
  const { db } = requireServices()
  await setDoc(doc(db, 'settings', 'store'), {
    ...cleanSettings(input),
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
  })
}
