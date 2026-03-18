import { describe, it, expect, beforeAll } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, testId } from './helpers/payload'
import sharp from 'sharp'

describe('API access (INF-03)', () => {
  let payload: Payload
  let testCategoryId: number
  let testProductId: number
  const uid = testId()

  beforeAll(async () => {
    payload = await getTestPayload()

    const category = await payload.create({
      collection: 'categories',
      data: { name: `API Cat ${uid}` },
    })
    testCategoryId = category.id

    const imgBuffer = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 100, g: 100, b: 100 } },
    })
      .png()
      .toBuffer()

    const media = await payload.create({
      collection: 'media',
      data: { alt: 'API test' },
      file: {
        data: imgBuffer,
        mimetype: 'image/png',
        name: `test-api-${uid}.png`,
        size: imgBuffer.length,
      },
    })

    const product = await payload.create({
      collection: 'products',
      data: {
        name: `API Product ${uid}`,
        images: [media.id],
        category: testCategoryId,
      },
    })
    testProductId = product.id
  })

  it('unauthenticated can read products (INF-03)', async () => {
    const result = await payload.find({
      collection: 'products',
      overrideAccess: false,
    })

    expect(result.docs).toBeDefined()
    expect(result.docs.length).toBeGreaterThan(0)
  })

  it('unauthenticated can read categories (INF-03)', async () => {
    const result = await payload.find({
      collection: 'categories',
      overrideAccess: false,
    })

    expect(result.docs).toBeDefined()
    expect(result.docs.length).toBeGreaterThan(0)
  })

  it('returns product data with category relationship populated', async () => {
    const result = await payload.findByID({
      collection: 'products',
      id: testProductId,
      depth: 1,
    })

    expect(result.name).toBe(`API Product ${uid}`)
    const category = result.category as any
    expect(typeof category).toBe('object')
    expect(category.name).toBe(`API Cat ${uid}`)
  })
})
