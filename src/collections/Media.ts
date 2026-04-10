import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import sharp from 'sharp'

const isAdmin = ({ req }: { req: any }) => Boolean(req.user)

const generateBlurDataURL: CollectionBeforeChangeHook = async ({ data, req }) => {
  // Only run on create when a file is being uploaded
  if (!req.file || !req.file.mimetype?.startsWith('image/')) return data

  try {
    // Use the in-memory buffer from the upload — works on both local and S3
    const buffer = await sharp(req.file.data)
      .resize(20, 20, { fit: 'inside' })
      .toFormat('webp', { quality: 20 })
      .toBuffer()

    data.blurDataURL = `data:image/webp;base64,${buffer.toString('base64')}`
  } catch (error) {
    console.error('Failed to generate blur placeholder:', error)
  }

  return data
}

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Media',
    plural: 'Media',
  },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    filesRequiredOnCreate: true,
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
    beforeChange: [
      generateBlurDataURL,
      ({ data, req }) => {
        // Auto-fill alt from filename if empty
        if (!data?.alt && req?.file?.name) {
          data = data || {}
          data.alt = req.file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
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
