import { readFileSync } from 'node:fs'
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'

export async function createEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: 'slimewali-rules-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
}

export const validCategory = (now: unknown) => ({
  name: 'Butter',
  slug: 'butter',
  description: 'Soft textures',
  imagePath: null,
  accentColor: '#D5E66D',
  sortOrder: 0,
  isActive: true,
  showOnHome: true,
  createdAt: now,
  updatedAt: now,
  createdBy: 'owner',
  updatedBy: 'owner',
})

export const validProduct = (now: unknown) => ({
  name: 'Cloud slime',
  slug: 'cloud-slime',
  shortDescription: 'Soft',
  description: 'A soft slime',
  categoryId: 'live',
  categoryNameSnapshot: 'Live',
  imagePaths: ['products/p/1.webp'],
  coverImagePath: 'products/p/1.webp',
  altTexts: [''],
  pricePaise: 29900,
  hasVariants: false,
  variants: [],
  stockQuantity: 5,
  lowStockThreshold: 3,
  status: 'draft',
  isFeatured: false,
  sortOrder: 0,
  tags: [],
  careInstructions: '',
  seoTitle: '',
  seoDescription: '',
  createdAt: now,
  updatedAt: now,
  createdBy: 'owner',
  updatedBy: 'owner',
})

export const validAddress = (now: unknown) => ({
  fullName: 'Test Customer',
  phone: '+919876543210',
  line1: '12 Example Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  pinCode: '400001',
  country: 'India',
  isDefault: true,
  createdAt: now,
  updatedAt: now,
})

export const validOrder = (now: unknown, uid = 'alice', email = 'alice@example.com', orderId = 'SW-261108-AB234') => ({
  orderNumber: orderId,
  customerUid: uid,
  customerName: 'Alice',
  customerEmail: email,
  customerPhone: '+919876543210',
  shippingAddress: {
    fullName: 'Alice',
    phone: '+919876543210',
    line1: '12 Example Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pinCode: '400001',
    country: 'India',
  },
  items: [
    {
      productId: 'pub',
      variantId: null,
      name: 'Pub',
      slug: 'pub',
      variantLabel: '',
      quantity: 2,
      unitPaise: 10000,
      lineTotalPaise: 20000,
      imagePath: null,
    },
  ],
  itemCount: 2,
  subtotalPaise: 20000,
  totalPaise: 20000,
  orderStatus: 'pending_review',
  paymentStatus: 'not_requested',
  contactStatus: 'not_contacted',
  consentAccepted: true,
  createdAt: now,
  updatedAt: now,
})
