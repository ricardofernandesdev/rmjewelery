import { describe, it, expect, beforeAll } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, testId } from '../helpers/payload'
import sharp from 'sharp'

describe('Category page queries (CAT-03)', () => {
  let payload: Payload
  const uid = testId()
  let catASlug: string
  let catBSlug: string

  beforeAll(async () => {
    payload = await getTestPayload()

    // Create 2 categories
    const catA = await payload.create({
      collection: 'categories',
      data: { name: `CatPage A ${uid}` },
    })
    catASlug = catA.slug!

    const catB = await payload.create({
      collection: 'categories',
      data: { name: `CatPage B ${uid}` },
    })
    catBSlug = catB.slug!

    // Create a shared image
    const imgBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 120, g: 100, b: 80 },
      },
    })
      .png()
      .toBuffer()

    const media = await payload.create({
      collection: 'media',
      data: { alt: `cat-page-${uid}` },
      file: {
        data: imgBuffer,
        mimetype: 'image/png',
        name: `catpage-${uid}.png`,
        size: imgBuffer.length,
      },
    })

    // Create 2 products in catA, 1 in catB
    for (let i = 0; i < 2; i++) {
      await payload.create({
        collection: 'products',
        data: {
          name: `CatA Product ${i} ${uid}`,
          images: [media.id],
          category: catA.id,
        },
      })
    }

    await payload.create({
      collection: 'products',
      data: {
        name: `CatB Product ${uid}`,
        images: [media.id],
        category: catB.id,
      },
    })
  })

  it('getProductsByCategory returns only products from specified category (CAT-03)', async () => {
    const { getProductsByCategory } = await import('../../src/lib/queries')
    const result = await getProductsByCategory(catASlug)

    const testProducts = result.docs.filter((p: any) =>
      p.name?.includes(uid),
    )
    expect(testProducts.length).toBe(2)
    testProducts.forEach((p: any) => {
      expect(p.name).toContain('CatA')
    })
  })

  it('does not include products from other categories', async () => {
    const { getProductsByCategory } = await import('../../src/lib/queries')
    const result = await getProductsByCategory(catASlug)

    const catBProducts = result.docs.filter((p: any) =>
      p.name?.includes('CatB'),
    )
    expect(catBProducts.length).toBe(0)
  })

  it('getCategoryBySlug returns category with correct data', async () => {
    const { getCategoryBySlug } = await import('../../src/lib/queries')
    const category = await getCategoryBySlug(catASlug)

    expect(category).not.toBeNull()
    expect(category!.name).toContain('CatPage A')
    expect(category!.slug).toBe(catASlug)
  })

  it('getCategoryBySlug returns null for nonexistent slug', async () => {
    const { getCategoryBySlug } = await import('../../src/lib/queries')
    const category = await getCategoryBySlug('nonexistent-cat-99999')

    expect(category).toBeNull()
  })

  it('getProductsByCategory returns empty for nonexistent category', async () => {
    const { getProductsByCategory } = await import('../../src/lib/queries')
    const result = await getProductsByCategory('nonexistent-cat-99999')

    expect(result.docs).toHaveLength(0)
  })
})
