import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { pt } from '@payloadcms/translations/languages/pt'
import { s3Storage } from '@payloadcms/storage-s3'
import { Media } from './src/collections/Media'
import { Categories } from './src/collections/Categories'
import { Products } from './src/collections/Products'
import { Users } from './src/collections/Users'
import { SiteSettings } from './src/globals/SiteSettings'
import { HomeSettings } from './src/globals/HomeSettings'
import { FooterSettings } from './src/globals/FooterSettings'
import sharp from 'sharp'

const useS3 = Boolean(process.env.S3_BUCKET && process.env.S3_ENDPOINT)

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
  }),
  editor: lexicalEditor(),
  collections: [Media, Categories, Products, Users],
  globals: [SiteSettings, HomeSettings, FooterSettings],
  sharp,
  i18n: {
    supportedLanguages: { pt },
    fallbackLanguage: 'pt',
  },
  admin: {
    avatar: {
      Component: './src/components/admin/UserAvatar#UserAvatar',
    },
    meta: {
      titleSuffix: '- RM Jewelry',
    },
    importMap: {
      baseDir: import.meta.dirname,
    },
    components: {
      graphics: {
        Logo: './src/components/admin/Logo#Logo',
        Icon: './src/components/admin/Icon#Icon',
      },
      actions: ['./src/components/admin/HeaderActions#HeaderActions'],
      beforeNavLinks: ['./src/components/admin/NavHeader#NavHeader'],
      views: {
        dashboard: {
          Component: './src/components/admin/Dashboard#Dashboard',
        },
        account: {
          Component: './src/components/admin/AccountView#AccountView',
        },
      },
    },
  },
  typescript: {
    outputFile: 'payload-types.ts',
  },
  plugins: [
    ...(useS3
      ? [
          s3Storage({
            collections: {
              media: { prefix: 'media' },
            },
            bucket: process.env.S3_BUCKET!,
            config: {
              endpoint: process.env.S3_ENDPOINT!,
              region: process.env.S3_REGION || 'auto',
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID!,
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
              },
              forcePathStyle: true,
            },
          }),
        ]
      : []),
  ],
  onInit: async (payload) => {
    if (process.env.NODE_ENV !== 'production') {
      const { seed } = await import('./src/seed')
      await seed(payload)
    }
  },
})
