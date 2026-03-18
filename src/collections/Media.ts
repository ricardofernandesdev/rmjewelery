import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'
import path from 'path'
import sharp from 'sharp'

const isAdmin = ({ req }: { req: any }) => Boolean(req.user)

const generateBlurDataURL: CollectionAfterChangeHook = async ({ doc, req }) => {
  // Skip if not an image
  if (!doc.filename || !doc.mimeType?.startsWith('image/')) return doc

  // Guard against infinite recursion: skip if blurDataURL is already populated
  if (doc.blurDataURL) return doc

  try {
    const filePath = path.resolve(process.cwd(), 'media', doc.filename)
    const buffer = await sharp(filePath)
      .resize(20, 20, { fit: 'inside' })
      .toFormat('webp', { quality: 20 })
      .toBuffer()

    const blurDataURL = `data:image/webp;base64,${buffer.toString('base64')}`

    await req.payload.update({
      collection: 'media',
      id: doc.id,
      data: { blurDataURL },
    })
  } catch (error) {
    console.error('Failed to generate blur placeholder:', error)
  }

  return doc
}

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*'],
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 400,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'card',
        width: 800,
        height: 800,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 82 } },
      },
      {
        name: 'detail',
        width: 1600,
        formatOptions: { format: 'webp', options: { quality: 85 } },
      },
      {
        name: 'zoom',
        width: 2400,
        formatOptions: { format: 'webp', options: { quality: 88 } },
      },
    ],
  },
  hooks: {
    afterChange: [generateBlurDataURL],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'blurDataURL',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
  ],
}
