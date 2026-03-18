import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, testId } from '../helpers/payload'
import sharp from 'sharp'

describe('Products collection (ADM-01, ADM-02, ADM-05)', () => {
  let payload: Payload
  let testCategoryId: number
  let testMediaId1: number
  let testMediaId2: number
  const createdProductIds: number[] = []
  const uid = testId()

  beforeAll(async () => {
    payload = await getTestPayload()

    const category = await payload.create({
      collection: 'categories',
      data: { name: `Products Test Cat ${uid}` },
    })
    testCategoryId = category.id

    const imgBuffer1 = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } },
    })
      .png()
      .toBuffer()

    const imgBuffer2 = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 0, b: 255 } },
    })
      .png()
      .toBuffer()

    const media1 = await payload.create({
      collection: 'media',
      data: { alt: 'Test image 1' },
      file: {
        data: imgBuffer1,
        mimetype: 'image/png',
        name: `test-prod-1-${uid}.png`,
        size: imgBuffer1.length,
      },
    })
    testMediaId1 = media1.id

    const media2 = await payload.create({
      collection: 'media',
      data: { alt: 'Test image 2' },
      file: {
        data: imgBuffer2,
        mimetype: 'image/png',
        name: `test-prod-2-${uid}.png`,
        size: imgBuffer2.length,
      },
    })
    testMediaId2 = media2.id
  })

  afterAll(async () => {
    for (const id of createdProductIds) {
      try {
        await payload.delete({ collection: 'products', id })
      } catch {
        // ignore
      }
    }
    try {
      await payload.delete({ collection: 'media', id: testMediaId1 })
      await payload.delete({ collection: 'media', id: testMediaId2 })
      await payload.delete({ collection: 'categories', id: testCategoryId })
    } catch {
      // ignore cleanup errors
    }
  })

  it('can create a product with name, description, and category (ADM-01)', async () => {
    const product = await payload.create({
      collection: 'products',
      data: {
        name: `Gold Ring ${uid}`,
        description: { root: { type: 'root', version: 1, direction: null, format: '' as const, indent: 0, children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text: 'A beautiful gold ring' }] }] } },
        images: [testMediaId1],
        category: testCategoryId,
      },
    })

    createdProductIds.push(product.id)
    expect(product.name).toBe(`Gold Ring ${uid}`)
    expect(product.category).toBeTruthy()
  })

  it('can upload multiple images to a product (ADM-02)', async () => {
    const product = await payload.create({
      collection: 'products',
      data: {
        name: `Silver Necklace ${uid}`,
        images: [testMediaId1, testMediaId2],
        category: testCategoryId,
      },
    })

    createdProductIds.push(product.id)
    expect(product.images).toHaveLength(2)
  })

  it('image order is preserved when creating product (ADM-05)', async () => {
    const product = await payload.create({
      collection: 'products',
      data: {
        name: `Ordered Images ${uid}`,
        images: [testMediaId2, testMediaId1],
        category: testCategoryId,
      },
    })

    createdProductIds.push(product.id)

    const fetched = await payload.findByID({
      collection: 'products',
      id: product.id,
    })

    const imageIds = (fetched.images as any[]).map((img: any) =>
      typeof img === 'object' ? img.id : img,
    )
    expect(imageIds[0]).toBe(testMediaId2)
    expect(imageIds[1]).toBe(testMediaId1)
  })

  it('slug auto-generates from product name', async () => {
    const product = await payload.create({
      collection: 'products',
      data: {
        name: `Anel Diamante ${uid}`,
        images: [testMediaId1],
        category: testCategoryId,
      },
    })

    createdProductIds.push(product.id)
    expect(product.slug).toContain('anel-diamante')
  })
})
