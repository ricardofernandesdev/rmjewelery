import type { Payload } from 'payload'

export const seed = async (payload: Payload): Promise<void> => {
  const existing = await payload.find({ collection: 'users', limit: 1 })

  if (existing.totalDocs > 0) {
    payload.logger.info('Admin user already exists, skipping seed')
    return
  }

  await payload.create({
    collection: 'users',
    data: {
      email: 'admin@rmjewelery.com',
      // WARNING: Development-only password. Change immediately in production via the admin panel.
      password: 'changeme123',
    },
  })

  payload.logger.info('Seeded initial admin user: admin@rmjewelery.com')
}
