import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { Media } from './src/collections/Media'
import { Categories } from './src/collections/Categories'
import { Products } from './src/collections/Products'
import sharp from 'sharp'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
  }),
  editor: lexicalEditor(),
  collections: [Media, Categories, Products],
  sharp,
  admin: {
    meta: {
      titleSuffix: '- RM Jewelry',
    },
    importMap: {
      baseDir: import.meta.dirname,
    },
  },
  typescript: {
    outputFile: 'payload-types.ts',
  },
  onInit: async (payload) => {
    const { seed } = await import('./src/seed')
    await seed(payload)
  },
})
