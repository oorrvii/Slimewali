import { deleteField, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { requireServices } from './firebase'
import type { SessionUser } from '@/domain/user'

export async function ensureUserProfile(user: SessionUser): Promise<void> {
  const { db } = requireServices()
  const ref = doc(db, 'users', user.uid)
  const snapshot = await getDoc(ref)
  if (snapshot.exists()) return

  await setDoc(ref, {
    displayName: user.displayName,
    email: user.email,
    ...(user.photoURL ? { photoURL: user.photoURL } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export type Profile = {
  displayName: string
  email: string
  phone: string
  instagram: string
}

export async function getProfile(uid: string): Promise<Profile | null> {
  const { db } = requireServices()
  const snapshot = await getDoc(doc(db, 'users', uid))
  if (!snapshot.exists()) return null
  const data = snapshot.data()
  return {
    displayName: String(data.displayName ?? ''),
    email: String(data.email ?? ''),
    phone: String(data.phone ?? ''),
    instagram: String(data.instagram ?? ''),
  }
}

export async function updateProfile(
  uid: string,
  changes: { displayName: string; phone: string; instagram: string },
): Promise<void> {
  const { db } = requireServices()
  await updateDoc(doc(db, 'users', uid), {
    displayName: changes.displayName,
    phone: changes.phone ? changes.phone : deleteField(),
    instagram: changes.instagram ? changes.instagram : deleteField(),
    updatedAt: serverTimestamp(),
  })
}
