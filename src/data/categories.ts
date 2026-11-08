import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { requireServices } from './firebase'
import { CategoryNotEmptyError, SlugTakenError } from './errors'
import { deleteStoredImages } from './media'
import {
  PALETTE_COLORS,
  type AccentColor,
  type Category,
  type CategoryInput,
} from '@/domain/catalogue'

const paletteValues: string[] = PALETTE_COLORS.map((color) => color.value)

function toCategory(id: string, data: DocumentData): Category {
  const accent = paletteValues.includes(data.accentColor) ? (data.accentColor as AccentColor) : '#D5E66D'
  return {
    id,
    name: String(data.name ?? ''),
    slug: String(data.slug ?? ''),
    description: String(data.description ?? ''),
    imagePath: typeof data.imagePath === 'string' ? data.imagePath : null,
    accentColor: accent,
    sortOrder: Number.isInteger(data.sortOrder) ? data.sortOrder : 0,
    isActive: data.isActive === true,
    showOnHome: data.showOnHome === true,
  }
}

function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  )
}

export async function listActiveCategories(): Promise<Category[]> {
  const { db } = requireServices()
  const snapshot = await getDocs(query(collection(db, 'categories'), where('isActive', '==', true)))
  return sortCategories(snapshot.docs.map((item) => toCategory(item.id, item.data())))
}

export async function listAllCategories(): Promise<Category[]> {
  const { db } = requireServices()
  const snapshot = await getDocs(collection(db, 'categories'))
  return sortCategories(snapshot.docs.map((item) => toCategory(item.id, item.data())))
}

export async function getActiveCategoryBySlug(slug: string): Promise<Category | null> {
  const { db } = requireServices()
  const snapshot = await getDocs(
    query(
      collection(db, 'categories'),
      where('slug', '==', slug),
      where('isActive', '==', true),
      limit(1),
    ),
  )
  const first = snapshot.docs[0]
  return first ? toCategory(first.id, first.data()) : null
}

export function newCategoryId(): string {
  const { db } = requireServices()
  return doc(collection(db, 'categories')).id
}

export async function saveCategory(
  input: CategoryInput,
  target: { id: string; previousSlug: string | null },
  actorUid: string,
): Promise<void> {
  const { db } = requireServices()
  const categoryRef = doc(db, 'categories', target.id)
  const slugRef = doc(db, 'slugIndex', `category_${input.slug}`)
  const isCreate = target.previousSlug === null

  await runTransaction(db, async (transaction) => {
    const slugSnapshot = await transaction.get(slugRef)
    if (slugSnapshot.exists() && slugSnapshot.data().refId !== target.id) {
      throw new SlugTakenError()
    }

    if (target.previousSlug !== null && target.previousSlug !== input.slug) {
      transaction.delete(doc(db, 'slugIndex', `category_${target.previousSlug}`))
    }
    transaction.set(slugRef, { kind: 'category', refId: target.id })

    transaction.set(
      categoryRef,
      {
        name: input.name.trim(),
        slug: input.slug,
        description: input.description.trim(),
        imagePath: input.imagePath,
        accentColor: input.accentColor,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
        showOnHome: input.showOnHome,
        updatedAt: serverTimestamp(),
        updatedBy: actorUid,
        ...(isCreate ? { createdAt: serverTimestamp(), createdBy: actorUid } : {}),
      },
      { merge: true },
    )
  })

  if (!isCreate) {
    const products = await getDocs(
      query(collection(db, 'products'), where('categoryId', '==', target.id), limit(500)),
    )
    const stale = products.docs.filter(
      (item) => item.data().categoryNameSnapshot !== input.name.trim(),
    )
    if (stale.length > 0) {
      const batch = writeBatch(db)
      stale.forEach((item) =>
        batch.update(item.ref, { categoryNameSnapshot: input.name.trim() }),
      )
      await batch.commit()
    }
  }
}

export type DeactivationChoice =
  | { type: 'reassign'; toCategoryId: string; toCategoryName: string }
  | { type: 'unpublish' }

export async function deactivateCategory(
  categoryId: string,
  choice: DeactivationChoice,
  actorUid: string,
): Promise<number> {
  const { db } = requireServices()
  const products = await getDocs(
    query(collection(db, 'products'), where('categoryId', '==', categoryId), limit(500)),
  )

  const affected = products.docs.filter((item) =>
    choice.type === 'reassign' ? true : item.data().status === 'published',
  )

  for (let start = 0; start < affected.length; start += 400) {
    const batch = writeBatch(db)
    affected.slice(start, start + 400).forEach((item) => {
      if (choice.type === 'reassign') {
        batch.update(item.ref, {
          categoryId: choice.toCategoryId,
          categoryNameSnapshot: choice.toCategoryName,
          updatedAt: serverTimestamp(),
          updatedBy: actorUid,
        })
      } else {
        batch.update(item.ref, {
          status: 'draft',
          updatedAt: serverTimestamp(),
          updatedBy: actorUid,
        })
      }
    })
    await batch.commit()
  }

  await updateDoc(doc(db, 'categories', categoryId), {
    isActive: false,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
  })
  return affected.length
}

export async function activateCategory(categoryId: string, actorUid: string): Promise<void> {
  const { db } = requireServices()
  await updateDoc(doc(db, 'categories', categoryId), {
    isActive: true,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
  })
}

export async function deleteCategory(category: Category): Promise<void> {
  const { db } = requireServices()
  const assigned = await getDocs(
    query(collection(db, 'products'), where('categoryId', '==', category.id), limit(1)),
  )
  if (!assigned.empty) throw new CategoryNotEmptyError()

  await deleteDoc(doc(db, 'slugIndex', `category_${category.slug}`))
  await deleteDoc(doc(db, 'categories', category.id))
  if (category.imagePath) {
    try {
      await deleteStoredImages([category.imagePath])
    } catch {
      console.error('Could not remove the category image file')
    }
  }
}
