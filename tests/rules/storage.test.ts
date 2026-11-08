import { afterAll, beforeAll, describe, it } from 'vitest'
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { ref, uploadBytes, getBytes } from 'firebase/storage'
import { createEnv } from './helpers'

let env: RulesTestEnvironment

const alice = { email: 'alice@example.com' }
const admin = { email: 'owner@example.com', admin: true }
const smallImage = new Uint8Array([1, 2, 3, 4])

beforeAll(async () => {
  env = await createEnv()
  await env.withSecurityRulesDisabled(async (context) => {
    await uploadBytes(ref(context.storage(), 'products/p1/cover.webp'), smallImage, { contentType: 'image/webp' })
  })
})

afterAll(async () => {
  await env.cleanup()
})

describe('storage rules', () => {
  it('anyone can read product images', async () => {
    const storage = env.unauthenticatedContext().storage()
    await assertSucceeds(getBytes(ref(storage, 'products/p1/cover.webp')))
  })

  it('admin can upload an image under products', async () => {
    const storage = env.authenticatedContext('owner', admin).storage()
    await assertSucceeds(uploadBytes(ref(storage, 'products/p2/cover.png'), smallImage, { contentType: 'image/png' }))
  })

  it('customers and guests cannot upload', async () => {
    const customer = env.authenticatedContext('alice', alice).storage()
    const guest = env.unauthenticatedContext().storage()
    await assertFails(uploadBytes(ref(customer, 'products/p3/cover.png'), smallImage, { contentType: 'image/png' }))
    await assertFails(uploadBytes(ref(guest, 'products/p3/cover.png'), smallImage, { contentType: 'image/png' }))
  })

  it('admin cannot upload non-image files', async () => {
    const storage = env.authenticatedContext('owner', admin).storage()
    await assertFails(uploadBytes(ref(storage, 'products/p4/file.txt'), smallImage, { contentType: 'text/plain' }))
    await assertFails(uploadBytes(ref(storage, 'products/p4/script.svg'), smallImage, { contentType: 'image/svg+xml' }))
  })

  it('admin cannot upload an image larger than 5 MB', async () => {
    const storage = env.authenticatedContext('owner', admin).storage()
    const large = new Uint8Array(5 * 1024 * 1024 + 1)
    await assertFails(uploadBytes(ref(storage, 'products/p5/big.jpg'), large, { contentType: 'image/jpeg' }))
  })

  it('paths outside products and categories are closed', async () => {
    const storage = env.authenticatedContext('owner', admin).storage()
    await assertFails(uploadBytes(ref(storage, 'private/qr.png'), smallImage, { contentType: 'image/png' }))
    await assertFails(getBytes(ref(storage, 'private/qr.png')))
  })
})
