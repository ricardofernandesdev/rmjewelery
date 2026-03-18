import type { Payload } from 'payload'

let cached: Payload | null = null

/**
 * Returns a cached Payload instance initialized with the project config.
 * Uses TEST_DATABASE_URI if set, otherwise falls back to DATABASE_URI.
 * Disables onInit to prevent seed script from running during tests.
 */
export async function getTestPayload(): Promise<Payload> {
  if (cached) return cached

  // Allow a separate test database
  if (process.env.TEST_DATABASE_URI) {
    process.env.DATABASE_URI = process.env.TEST_DATABASE_URI
  }

  const { getPayload } = await import('payload')
  const config = await import('@payload-config')

  cached = await getPayload({
    config: config.default,
    disableOnInit: true,
  })

  return cached
}

/** Generate a unique suffix for test data to avoid slug collisions across runs */
export function testId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
