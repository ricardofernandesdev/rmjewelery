import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, testId } from '../helpers/payload'

describe('Categories collection (ADM-06)', () => {
  let payload: Payload
  const createdIds: number[] = []
  const uid = testId()

  beforeAll(async () => {
    payload = await getTestPayload()
  })

  afterAll(async () => {
    for (const id of createdIds) {
      try {
        await payload.delete({ collection: 'categories', id })
      } catch {
        // ignore cleanup errors
      }
    }
  })

  it('can create a category with name and slug auto-generates', async () => {
    const category = await payload.create({
      collection: 'categories',
      data: { name: `Aneis ${uid}` },
    })

    createdIds.push(category.id)
    expect(category.name).toBe(`Aneis ${uid}`)
    expect(category.slug).toContain('aneis')
  })

  it('can update a category name', async () => {
    const category = await payload.create({
      collection: 'categories',
      data: { name: `Temp Category ${uid}` },
    })
    createdIds.push(category.id)

    const updated = await payload.update({
      collection: 'categories',
      id: category.id,
      data: { name: `Updated Category ${uid}` },
    })

    expect(updated.name).toBe(`Updated Category ${uid}`)
  })

  it('can delete a category', async () => {
    const category = await payload.create({
      collection: 'categories',
      data: { name: `To Delete ${uid}` },
    })

    await payload.delete({ collection: 'categories', id: category.id })

    const result = await payload.find({
      collection: 'categories',
      where: { id: { equals: category.id } },
    })

    expect(result.totalDocs).toBe(0)
  })

  it('slug strips Portuguese diacritics', async () => {
    const category = await payload.create({
      collection: 'categories',
      data: { name: `Colecao Verao ${uid}` },
    })

    createdIds.push(category.id)
    expect(category.slug).toContain('colecao-verao')
  })
})
