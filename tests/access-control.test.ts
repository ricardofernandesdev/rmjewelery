import { describe, it, expect, beforeAll } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, testId } from './helpers/payload'
import sharp from 'sharp'

describe('Access control (INF-02)', () => {
  let payload: Payload
  let testCategoryId: number
  let testMediaId: number
  const uid = testId()

  beforeAll(async () => {
    payload = await getTestPayload()

    const category = await payload.create({
      collection: 'categories',
      data: { name: `Access Cat ${uid}` },
    })
    testCategoryId = category.id

    const imgBuffer = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 255, b: 0 } },
    })
      .png()
      .toBuffer()

    const media = await payload.create({
      collection: 'media',
      data: { alt: 'Access test' },
      file: {
        data: imgBuffer,
        mimetype: 'image/png',
        name: `test-access-${uid}.png`,
        size: imgBuffer.length,
      },
    })
    testMediaId = media.id
  })

  it('unauthenticated cannot create products (INF-02)', async () => {
    await expect(
      payload.create({
        collection: 'products',
        data: {
          name: `Unauth Product ${uid}`,
          images: [testMediaId],
          category: testCategoryId,
        },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('unauthenticated cannot delete products (INF-02)', async () => {
    const product = await payload.create({
      collection: 'products',
      data: {
        name: `No Delete ${uid}`,
        images: [testMediaId],
        category: testCategoryId,
      },
    })

    await expect(
      payload.delete({
        collection: 'products',
        id: product.id,
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    // Clean up
    await payload.delete({ collection: 'products', id: product.id })
  })

  it('authenticated admin can create products', async () => {
    const users = await payload.find({ collection: 'users', limit: 1 })
    let adminUser: any

    if (users.totalDocs === 0) {
      adminUser = await payload.create({
        collection: 'users',
        data: { email: `test-admin-${uid}@rmjewelery.com`, password: 'testpass123' },
      })
    } else {
      adminUser = users.docs[0]
    }

    const product = await payload.create({
      collection: 'products',
      data: {
        name: `Auth Product ${uid}`,
        images: [testMediaId],
        category: testCategoryId,
      },
      overrideAccess: false,
      user: adminUser,
    })

    expect(product.name).toBe(`Auth Product ${uid}`)

    // Clean up
    await payload.delete({ collection: 'products', id: product.id })
  })
})
