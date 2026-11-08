import {
  collection,
  deleteField,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { requireServices } from './firebase'
import { cleanAddress, type Address, type AddressInput } from '@/domain/address'

function toAddress(id: string, data: DocumentData): Address {
  return {
    id,
    fullName: String(data.fullName ?? ''),
    phone: String(data.phone ?? ''),
    line1: String(data.line1 ?? ''),
    line2: String(data.line2 ?? ''),
    landmark: String(data.landmark ?? ''),
    city: String(data.city ?? ''),
    state: String(data.state ?? ''),
    pinCode: String(data.pinCode ?? ''),
    isDefault: data.isDefault === true,
    country: 'India',
  }
}

export async function listAddresses(uid: string): Promise<Address[]> {
  const { db } = requireServices()
  const snapshot = await getDocs(
    query(collection(db, 'users', uid, 'addresses'), orderBy('createdAt', 'desc')),
  )
  const items = snapshot.docs.map((item) => toAddress(item.id, item.data()))
  return items.sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
}

export function newAddressId(uid: string): string {
  const { db } = requireServices()
  return doc(collection(db, 'users', uid, 'addresses')).id
}

export async function saveAddress(
  uid: string,
  id: string | null,
  input: AddressInput,
  others: Address[],
): Promise<void> {
  const { db } = requireServices()
  const clean = cleanAddress(input)
  const makeDefault = clean.isDefault || others.filter((item) => item.id !== id).length === 0
  const addressId = id ?? newAddressId(uid)
  const ref = doc(db, 'users', uid, 'addresses', addressId)

  const fields = {
    fullName: clean.fullName,
    phone: clean.phone,
    line1: clean.line1,
    line2: clean.line2 ? clean.line2 : deleteField(),
    landmark: clean.landmark ? clean.landmark : deleteField(),
    city: clean.city,
    state: clean.state,
    pinCode: clean.pinCode,
    country: 'India',
    isDefault: makeDefault,
    updatedAt: serverTimestamp(),
  }

  const batch = writeBatch(db)
  if (id === null) {
    const created: Record<string, unknown> = { ...fields, createdAt: serverTimestamp() }
    if (!clean.line2) delete created.line2
    if (!clean.landmark) delete created.landmark
    batch.set(ref, created)
  } else {
    batch.update(ref, fields)
  }
  if (makeDefault) {
    for (const other of others) {
      if (other.id !== addressId && other.isDefault) {
        batch.update(doc(db, 'users', uid, 'addresses', other.id), {
          isDefault: false,
          updatedAt: serverTimestamp(),
        })
      }
    }
  }
  await batch.commit()
}

export async function setDefaultAddress(uid: string, id: string, others: Address[]): Promise<void> {
  const { db } = requireServices()
  const batch = writeBatch(db)
  batch.update(doc(db, 'users', uid, 'addresses', id), { isDefault: true, updatedAt: serverTimestamp() })
  for (const other of others) {
    if (other.id !== id && other.isDefault) {
      batch.update(doc(db, 'users', uid, 'addresses', other.id), {
        isDefault: false,
        updatedAt: serverTimestamp(),
      })
    }
  }
  await batch.commit()
}

export async function deleteAddress(uid: string, target: Address, others: Address[]): Promise<void> {
  const { db } = requireServices()
  const batch = writeBatch(db)
  batch.delete(doc(db, 'users', uid, 'addresses', target.id))
  const remaining = others.filter((item) => item.id !== target.id)
  if (target.isDefault && remaining.length > 0) {
    batch.update(doc(db, 'users', uid, 'addresses', remaining[0].id), {
      isDefault: true,
      updatedAt: serverTimestamp(),
    })
  }
  await batch.commit()
}

