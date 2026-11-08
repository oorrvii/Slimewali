import { doc, getDoc, getDocs, collection, serverTimestamp, setDoc, type DocumentData } from 'firebase/firestore'
import { requireServices } from './firebase'
import { PAGE_DEFINITIONS, definitionOf, type ContentPage, type FaqItem, type PageId, type PageInput } from '@/domain/content'

function millis(value: unknown): number {
  const candidate = value as { toMillis?: () => number } | null
  return candidate && typeof candidate.toMillis === 'function' ? candidate.toMillis() : 0
}

function toPage(id: PageId, data: DocumentData): ContentPage {
  const items: FaqItem[] = Array.isArray(data.items)
    ? data.items.map((item: DocumentData) => ({
        question: String(item.question ?? ''),
        answer: String(item.answer ?? ''),
      }))
    : []
  return {
    id,
    title: typeof data.title === 'string' && data.title ? data.title : definitionOf(id).title,
    body: String(data.body ?? ''),
    items,
    isPublished: data.isPublished === true,
    updatedAtMs: millis(data.updatedAt),
  }
}

export async function getPublishedPage(id: PageId): Promise<ContentPage | null> {
  const { db } = requireServices()
  try {
    const snapshot = await getDoc(doc(db, 'content', id))
    if (!snapshot.exists()) return null
    const page = toPage(id, snapshot.data())
    return page.isPublished ? page : null
  } catch {
    return null
  }
}

export async function listPagesAdmin(): Promise<Map<PageId, ContentPage>> {
  const { db } = requireServices()
  const snapshot = await getDocs(collection(db, 'content'))
  const pages = new Map<PageId, ContentPage>()
  for (const item of snapshot.docs) {
    const definition = PAGE_DEFINITIONS.find((page) => page.id === item.id)
    if (definition) pages.set(definition.id, toPage(definition.id, item.data()))
  }
  return pages
}

export async function getPageAdmin(id: PageId): Promise<ContentPage | null> {
  const { db } = requireServices()
  const snapshot = await getDoc(doc(db, 'content', id))
  return snapshot.exists() ? toPage(id, snapshot.data()) : null
}

export async function savePage(id: PageId, input: PageInput, actorUid: string): Promise<void> {
  const { db } = requireServices()
  await setDoc(doc(db, 'content', id), {
    title: input.title.trim(),
    body: input.body,
    items: input.items.map((item) => ({ question: item.question.trim(), answer: item.answer.trim() })),
    isPublished: input.isPublished,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
  })
}
