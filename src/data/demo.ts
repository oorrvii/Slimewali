import { deleteDoc, doc } from 'firebase/firestore'
import { saveCategory } from './categories'
import { requireServices } from './firebase'
import { saveProduct } from './products'
import { emptyCategoryInput, emptyProductInput } from '@/domain/catalogue'

export const DEMO_CATEGORY_ID = 'demo-category'
export const DEMO_PRODUCT_ID = 'demo-butter-slime'

export async function createDemoCatalogue(actorUid: string): Promise<void> {
  await saveCategory(
    {
      ...emptyCategoryInput(),
      name: 'Demo',
      slug: 'demo',
      description: 'A demo category for trying out the shop. Safe to delete.',
      accentColor: '#A99BEA',
      sortOrder: 99,
    },
    { id: DEMO_CATEGORY_ID, previousSlug: null },
    actorUid,
  )

  await saveProduct(
    {
      ...emptyProductInput(),
      name: 'Demo butter slime',
      slug: 'demo-butter-slime',
      shortDescription: 'A demo product for testing the cart and checkout.',
      description:
        'This is a demo product so you can try the cart, checkout and order approval. Archive or delete it before you launch.',
      categoryId: DEMO_CATEGORY_ID,
      categoryNameSnapshot: 'Demo',
      imagePaths: ['/demo-slime.svg'],
      coverImagePath: '/demo-slime.svg',
      altTexts: ['Illustration of a lavender demo slime'],
      pricePaise: 24900,
      hasVariants: true,
      variants: [
        { id: 'demo-50', label: '50 ml jar', sku: 'DEMO-50', pricePaise: 24900, compareAtPaise: 29900, stockQuantity: 20, isActive: true },
        { id: 'demo-100', label: '100 ml jar', sku: 'DEMO-100', pricePaise: 44900, compareAtPaise: null, stockQuantity: 15, isActive: true },
      ],
      status: 'published',
      isFeatured: true,
      tags: ['demo'],
    },
    { id: DEMO_PRODUCT_ID, previousSlug: null },
    actorUid,
  )
}

export async function removeDemoCatalogue(): Promise<void> {
  const { db } = requireServices()
  await deleteDoc(doc(db, 'products', DEMO_PRODUCT_ID))
  await deleteDoc(doc(db, 'slugIndex', 'product_demo-butter-slime'))
  await deleteDoc(doc(db, 'categories', DEMO_CATEGORY_ID))
  await deleteDoc(doc(db, 'slugIndex', 'category_demo'))
}
