import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { pt } from '@payloadcms/translations/languages/pt'
import { s3Storage } from '@payloadcms/storage-s3'
import { Media } from './src/collections/Media'
import { Categories } from './src/collections/Categories'
import { Products } from './src/collections/Products'
import { Colors } from './src/collections/Colors'
import { Sizes } from './src/collections/Sizes'
import { Users } from './src/collections/Users'
import { Pages } from './src/collections/Pages'
import { SiteSettings } from './src/globals/SiteSettings'
import { HomeSettings } from './src/globals/HomeSettings'
import { FooterSettings } from './src/globals/FooterSettings'
import sharp from 'sharp'

const useR2 = Boolean(
  process.env.R2_BUCKET &&
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY,
)

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
    // Disable auto-push so Payload only applies explicit migrations from
    // src/migrations/. Prevents destructive auto-sync when TS schema changes.
    push: false,
  }),
  editor: lexicalEditor(),
  collections: [Media, Categories, Colors, Sizes, Products, Users, Pages],
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
      afterNavLinks: ['./src/components/admin/NavExtras#NavExtras'],
      views: {
        dashboard: {
          Component: './src/components/admin/Dashboard#Dashboard',
        },
        account: {
          Component: './src/components/admin/AccountView#AccountView',
        },
        'bulk-upload': {
          Component: './src/components/admin/MediaBulkUploadView#default',
          path: '/bulk-upload',
        },
        usage: {
          Component: './src/components/admin/UsagePanelView#default',
          path: '/usage',
        },
        prices: {
          Component: './src/components/admin/PricesPanelView#default',
          path: '/prices',
        },
      },
    },
  },
  typescript: {
    outputFile: 'payload-types.ts',
  },
  plugins: [
    ...(useR2
      ? [
          s3Storage({
            collections: { media: true },
            bucket: process.env.R2_BUCKET!,
            config: {
              region: 'auto',
              endpoint: process.env.R2_ENDPOINT!,
              forcePathStyle: true,
              credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID!,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
              },
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
