# Phase 1: Foundation & Data Model - Research

**Researched:** 2026-03-18
**Domain:** Payload CMS 3 project setup, collection schema design, image upload pipeline, access control
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire project foundation: initializing the Payload CMS 3 + Next.js application, defining the core data model (products, categories, media), configuring image processing for jewelry photography, and securing the admin panel. This is a backend-and-admin-only phase -- no public frontend pages are built yet.

The core work is: (1) scaffold the project with `create-payload-app`, (2) define three Payload collections (Products, Categories, Media) plus the built-in Users collection, (3) configure Sharp-based image processing with jewelry-specific sizes and WebP conversion, (4) set up access control so the API is publicly readable but only admin-writable, and (5) configure revalidation hooks for future cache invalidation. The Payload admin panel at `/admin` provides the full CRUD interface out of the box -- no custom admin UI needed.

**Primary recommendation:** Define all collection schemas completely before writing any code. The data model drives everything else. Get fields, relationships, access control, and image sizes right in the schema, and Payload generates the admin UI, API, and TypeScript types automatically.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADM-01 | Admin can create, edit, and delete products with name, description, and category | Products collection with name, description (richText), category (relationship to Categories). Payload admin auto-generates CRUD forms. |
| ADM-02 | Admin can upload multiple photos per product with drag-and-drop | Products collection uses `upload` field with `hasMany: true` referencing Media collection, or an array field wrapping upload fields. Payload admin supports drag-and-drop upload natively. |
| ADM-05 | Admin can reorder product photos | Use `upload` field with `hasMany: true` and `isSortable: true` in admin config, OR use an array field (arrays are inherently sortable via drag-and-drop in Payload admin). |
| ADM-06 | Admin can create, edit, and delete categories | Categories collection with name, slug, description, image. Payload admin auto-generates CRUD. |
| INF-01 | Images automatically processed on upload (resize, WebP, multiple sizes, blur placeholder) | Media collection with `imageSizes` config defining thumbnail/card/detail/zoom sizes with `formatOptions: { format: 'webp' }`. Blur placeholder via afterChange hook using Sharp to generate base64 blurDataURL. |
| INF-02 | Admin panel protected by authentication (single admin user) | Payload built-in Users collection with email/password auth. Admin panel at `/admin` requires login by default. Seed initial admin user. |
| INF-03 | API serves all data for public frontend consumption | Payload auto-generates REST API at `/api/{collection}`. Access control set to public read, admin-only write. Local API available for Server Components. |
</phase_requirements>

## Standard Stack

### Core (Phase 1 Specific)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Payload CMS | ^3.79 | CMS, admin panel, REST API, auth | Embeds in Next.js, auto-generates admin UI and API from collection configs |
| @payloadcms/next | ^3.79 | Next.js integration adapter | Official adapter wiring Payload into App Router |
| @payloadcms/db-postgres | ^3.79 | PostgreSQL database adapter | Uses Drizzle ORM internally, `db push` in dev for auto-migration |
| @payloadcms/richtext-lexical | ^3.79 | Rich text editor | Required for product descriptions; Lexical-based, built by Meta |
| Sharp | ^0.34 | Image processing | Resize, WebP conversion, blur placeholder generation. Payload uses it internally |
| Next.js | ^16.1 | Framework | App Router, Server Components, required by Payload 3 |
| TypeScript | ^5.9 | Type safety | Payload generates types from schemas |
| PostgreSQL | 16+ | Database | Relational model fits catalog data; free tier on Neon |

### Supporting (Phase 1)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | ^4.2 | Styling | Only for admin branding customization in Phase 1 |
| Zod | ^4.3 | Validation | Environment variable validation |

### Not Yet Needed (Later Phases)

| Library | Phase | Purpose |
|---------|-------|---------|
| Framer Motion | Phase 6 | Animations -- no public frontend in Phase 1 |
| Lucide React | Phase 2 | Icons -- no public frontend in Phase 1 |
| @payloadcms/plugin-seo | Phase 5 | SEO fields -- no public pages in Phase 1 |

## Architecture Patterns

### Project Structure (Phase 1 Output)

```
rmjewelery/
  /app
    /(payload)
      /admin                    # Payload admin panel (auto-configured)
        /[[...segments]]
          /page.tsx
      /api                      # Payload REST API routes
        /[...slug]
          /route.ts
    /layout.tsx                 # Root layout
    /page.tsx                   # Placeholder homepage
  /collections                  # Payload collection configs
    /Products.ts
    /Categories.ts
    /Media.ts
  /lib
    /payload.ts                 # getPayload helper
    /slugFormat.ts              # Slug generation utility
  /public                       # Static assets
  /media                        # Uploaded files (Payload manages, gitignored)
  payload.config.ts             # Main Payload configuration
  next.config.ts                # Next.js configuration
  .env                          # Environment variables (gitignored)
  .env.example                  # Template with required vars
```

### Pattern 1: Collection Schema First, Code Second

**What:** Define all Payload collection configs (fields, relationships, access, hooks) completely before building any frontend or custom logic.

**When:** Always in Phase 1. The data model is the foundation.

**Why:** Payload auto-generates admin UI, REST API, and TypeScript types from collection configs. Changing schemas after building frontend components causes cascading rework.

### Pattern 2: Upload Field with hasMany for Product Images

**What:** Use Payload's `upload` field with `hasMany: true` and `isSortable: true` for multiple product images, rather than a separate join table or array field.

**When:** Product collection images field.

**Why:** Simpler than array-of-uploads pattern. Built-in drag-and-drop reordering in admin panel. Order is persisted automatically.

```typescript
// In Products collection
{
  name: 'images',
  type: 'upload',
  relationTo: 'media',
  hasMany: true,
  required: true,
  admin: {
    isSortable: true,  // Enables drag-and-drop reordering
  },
}
```

**Alternative:** If additional per-image metadata is needed (e.g., caption, alt override), use an array field wrapping an upload field instead:

```typescript
{
  name: 'images',
  type: 'array',
  minRows: 1,
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
    },
  ],
}
```

### Pattern 3: Access Control on Every Collection

**What:** Define read/create/update/delete access functions on every collection from the start.

**When:** Every collection definition in Phase 1.

**Why:** Payload API is publicly accessible. Without access control, anyone can POST/DELETE to `/api/products`. This is a security pitfall documented in research.

```typescript
// Standard access control pattern for content collections
const isAdmin = ({ req }: { req: any }) => Boolean(req.user)

export const Products: CollectionConfig = {
  slug: 'products',
  access: {
    read: () => true,         // Public: anyone can read products
    create: isAdmin,          // Admin only
    update: isAdmin,          // Admin only
    delete: isAdmin,          // Admin only
  },
  // ...
}
```

### Pattern 4: Slug Auto-Generation with Diacritics Stripping

**What:** Auto-generate URL slugs from the name field, stripping Portuguese diacritics.

**When:** Products, Categories collections.

**Why:** Portuguese product names contain accented characters. Slugs must be URL-safe ASCII. Payload does not strip diacritics by default.

```typescript
// lib/slugFormat.ts
export const formatSlug = (val: string): string =>
  val
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

// In collection field hooks
{
  name: 'slug',
  type: 'text',
  unique: true,
  admin: { position: 'sidebar' },
  hooks: {
    beforeValidate: [
      ({ value, data, operation }) => {
        if (operation === 'create' && !value && data?.name) {
          return formatSlug(data.name)
        }
        return value
      },
    ],
  },
}
```

### Pattern 5: Image Sizes for Jewelry Photography

**What:** Configure Media collection with jewelry-specific image sizes optimized for quality and performance.

**When:** Media collection upload config.

**Why:** Jewelry needs higher quality than typical web images (metallic textures, shine, detail). Default compression loses visual fidelity.

```typescript
export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*'],
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
    adminThumbnail: 'thumbnail',
  },
  fields: [
    { name: 'alt', type: 'text', required: true },
  ],
}
```

### Pattern 6: Blur Placeholder Generation via Hook

**What:** Generate base64 blur placeholder (blurDataURL) for every uploaded image using an afterChange hook with Sharp.

**When:** Media collection hook.

**Why:** HOME-05 requires blur-up placeholder loading. Generating at upload time avoids runtime cost. Next.js Image component accepts `blurDataURL` prop directly.

```typescript
// afterChange hook on Media collection
import sharp from 'sharp'

const generateBlurDataURL = async ({ doc, req }) => {
  if (!doc.filename || !doc.mimeType?.startsWith('image/')) return doc

  const filePath = `${req.payload.config.upload?.staticDir || 'media'}/${doc.filename}`
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

  return doc
}
```

**Note:** Add a `blurDataURL` text field to the Media collection (hidden from admin, populated by hook).

### Anti-Patterns to Avoid

- **Building custom admin pages:** Payload generates the admin UI. Do not build custom React admin components for CRUD operations.
- **Using Prisma/Drizzle alongside Payload:** Payload manages the database layer via its own adapters. Adding another ORM creates conflicts.
- **Fetching REST API from Server Components:** Use Payload Local API (`payload.find()`) instead -- in-process, no HTTP overhead.
- **Storing image binaries in PostgreSQL:** Payload stores files on disk/cloud, metadata in DB. Never put image blobs in the database.
- **Skipping access control during development:** Set access control from day one. Forgetting to add it later exposes public write endpoints.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Admin CRUD interface | Custom React forms for products/categories | Payload auto-generated admin panel | Weeks of work vs zero effort |
| REST API endpoints | Next.js API routes for products/categories | Payload auto-generated REST API | Payload handles pagination, filtering, auth checks |
| Authentication | Custom login/session management | Payload built-in auth | Secure, tested, handles tokens/cookies |
| Image resize/optimize | Custom Sharp pipeline scripts | Payload upload `imageSizes` config | Payload runs Sharp automatically on upload |
| Database migrations | Manual SQL or Drizzle migrations | Payload `db push` (dev) / `payload migrate` (prod) | Payload manages schema sync |
| Slug generation | Custom route-level slug logic | Payload field hook with `beforeValidate` | Runs automatically, consistent, validated |
| File upload handling | Custom multer/formidable setup | Payload upload collection | Handles multipart, validation, storage |

## Common Pitfalls

### Pitfall 1: Schema Changes After Building Components
**What goes wrong:** Start coding immediately, change collection fields repeatedly, frontend components break.
**Why it happens:** Payload makes it easy to add collections, so developers skip planning.
**How to avoid:** Define ALL collections completely (fields, relationships, access, hooks) before writing any other code. Review with stakeholder if possible.
**Warning signs:** Changing a collection field name after a component references it.

### Pitfall 2: Open API Write Endpoints
**What goes wrong:** Anyone can POST to `/api/products` and create/delete products.
**Why it happens:** Payload default access can be permissive. Developer forgets to configure access control.
**How to avoid:** Set access control on EVERY collection: `read: () => true`, `create/update/delete: isAdmin`. Test by hitting POST endpoints without auth.
**Warning signs:** No `access` property in collection config.

### Pitfall 3: Image Quality Too Low for Jewelry
**What goes wrong:** WebP compression at default quality (75) loses metallic texture and shine detail. Brand owner rejects images.
**Why it happens:** Standard web optimization settings target general photography, not reflective metallic surfaces.
**How to avoid:** Use quality 80-88 depending on size tier. Test with actual jewelry photos during development.
**Warning signs:** Images look flat or lose surface detail compared to originals.

### Pitfall 4: Portuguese Diacritics Breaking Slugs
**What goes wrong:** "Colecao Verao" creates broken or ugly slugs. Database lookups fail.
**Why it happens:** Default slug generation may not handle diacritics (`a`, `e`, `c`, `o`).
**How to avoid:** Custom `formatSlug` function using `normalize('NFD')` to strip diacritics before slugifying.
**Warning signs:** Slugs containing `%C3%A7` or similar encoded characters.

### Pitfall 5: Image Storage on Ephemeral Filesystem
**What goes wrong:** Images work in dev, disappear after deploying to Vercel (ephemeral filesystem).
**Why it happens:** Local disk storage is the default. Serverless platforms reset on each deploy.
**How to avoid:** Decide deployment target in Phase 1. If Vercel: plan for `@payloadcms/storage-vercel-blob` or `@payloadcms/storage-s3`. If VPS: local disk is fine.
**Warning signs:** Images vanish after redeployment.

### Pitfall 6: Forgetting Revalidation Hooks
**What goes wrong:** Admin changes product in admin panel, public site still shows old content.
**Why it happens:** ISR/static pages are cached. Without `afterChange` hooks calling `revalidatePath`, stale content persists.
**How to avoid:** Add `afterChange` hooks to Products and Categories from Phase 1, even before public pages exist. The hooks will be ready when public pages are built in Phase 2.
**Warning signs:** Admin edits not visible on public site.

## Code Examples

### Complete Products Collection Config

```typescript
// collections/Products.ts
import type { CollectionConfig } from 'payload'
import { formatSlug } from '@/lib/slugFormat'

const isAdmin = ({ req }: { req: any }) => Boolean(req.user)

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'createdAt'],
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      admin: { position: 'sidebar' },
      hooks: {
        beforeValidate: [
          ({ value, data, operation }) => {
            if (operation === 'create' && !value && data?.name) {
              return formatSlug(data.name)
            }
            return value
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'richText',  // Lexical editor
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      admin: {
        isSortable: true,
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    afterChange: [
      ({ doc }) => {
        // Ready for Phase 2: revalidate public pages
        // revalidatePath(`/products/${doc.slug}`)
        // revalidatePath('/')
      },
    ],
  },
}
```

### Complete Categories Collection Config

```typescript
// collections/Categories.ts
import type { CollectionConfig } from 'payload'
import { formatSlug } from '@/lib/slugFormat'

const isAdmin = ({ req }: { req: any }) => Boolean(req.user)

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      admin: { position: 'sidebar' },
      hooks: {
        beforeValidate: [
          ({ value, data, operation }) => {
            if (operation === 'create' && !value && data?.name) {
              return formatSlug(data.name)
            }
            return value
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
}
```

### Payload Config Entry Point

```typescript
// payload.config.ts
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { Products } from './collections/Products'
import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import sharp from 'sharp'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
  }),
  editor: lexicalEditor(),
  collections: [Products, Categories, Media],
  sharp,
  admin: {
    meta: {
      titleSuffix: '- RM Jewelry',
    },
  },
  typescript: {
    outputFile: 'payload-types.ts',
  },
})
```

### Environment Variables

```bash
# .env.example
DATABASE_URI=postgresql://user:pass@localhost:5432/rmjewelery
PAYLOAD_SECRET=your-secret-key-at-least-32-characters-long
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Payload 2 (separate Express server) | Payload 3 (embedded in Next.js) | 2024 | Single deployment, no CORS, simpler architecture |
| MongoDB default in Payload | PostgreSQL as recommended for production | Payload 3 | Relational model, better for structured catalog data |
| Manual Drizzle migrations | `db push` in development, `payload migrate` in production | Payload 3 | Schema changes auto-sync in dev mode |
| Custom image pipeline | Payload `imageSizes` + `formatOptions` in upload config | Payload 3 | Declarative image processing, no custom Sharp scripts |
| Slate rich text editor | Lexical rich text editor | Payload 3 | Modern, extensible, better performance |

## Open Questions

1. **Image storage strategy for production**
   - What we know: Local disk works for dev. Vercel has ephemeral filesystem.
   - What's unclear: Whether to use Vercel Blob, S3, or deploy to VPS with persistent disk.
   - Recommendation: Start with local storage for Phase 1 development. Decide deployment target before Phase 2. Add storage adapter then.

2. **Blur placeholder approach**
   - What we know: Sharp can generate tiny base64 images. Next.js Image accepts `blurDataURL`. Community plugins exist (payload-base64-plugin, payload-blurhash-plugin).
   - What's unclear: Whether to use a community plugin or custom afterChange hook. Whether Payload 3 has any built-in blur support now.
   - Recommendation: Implement via custom afterChange hook with Sharp (simple, no plugin dependency). Store as text field on Media collection.

3. **Upload field hasMany vs array field for product images**
   - What we know: `upload` with `hasMany: true` + `isSortable: true` is simpler. Array field allows per-image metadata (caption, alt override).
   - What's unclear: Whether drag-and-drop reordering works well with hasMany upload in current Payload version.
   - Recommendation: Start with `hasMany: true` + `isSortable: true` (simpler). Switch to array field only if per-image metadata is needed later.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (recommended for modern ESM + TypeScript) |
| Config file | none -- see Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADM-01 | Products CRUD via Local API | integration | `npx vitest run tests/collections/products.test.ts -t "create product"` | No -- Wave 0 |
| ADM-02 | Multiple image upload on product | integration | `npx vitest run tests/collections/products.test.ts -t "upload images"` | No -- Wave 0 |
| ADM-05 | Image reorder persists order | integration | `npx vitest run tests/collections/products.test.ts -t "reorder images"` | No -- Wave 0 |
| ADM-06 | Categories CRUD via Local API | integration | `npx vitest run tests/collections/categories.test.ts` | No -- Wave 0 |
| INF-01 | Image processing generates sizes + blur | integration | `npx vitest run tests/collections/media.test.ts -t "image sizes"` | No -- Wave 0 |
| INF-02 | Admin auth protects write endpoints | integration | `npx vitest run tests/access-control.test.ts` | No -- Wave 0 |
| INF-03 | REST API returns product data publicly | integration | `npx vitest run tests/api.test.ts -t "public read"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration with Payload test setup
- [ ] `tests/helpers/payload.ts` -- Shared test helper to initialize Payload with test database
- [ ] `tests/collections/products.test.ts` -- Products CRUD + image upload tests
- [ ] `tests/collections/categories.test.ts` -- Categories CRUD tests
- [ ] `tests/collections/media.test.ts` -- Image processing tests
- [ ] `tests/access-control.test.ts` -- Access control verification
- [ ] Framework install: `npm install -D vitest` -- if none detected

## Sources

### Primary (HIGH confidence)
- Payload CMS official docs: [Uploads](https://payloadcms.com/docs/upload/overview) -- imageSizes, formatOptions, Sharp integration
- Payload CMS official docs: [Collection Configs](https://payloadcms.com/docs/configuration/collections) -- fields, access, hooks
- Payload CMS official docs: [Access Control](https://payloadcms.com/docs/access-control/collections) -- collection-level access patterns
- Payload CMS official docs: [Installation](https://payloadcms.com/docs/getting-started/installation) -- create-payload-app setup
- Payload CMS official docs: [PostgreSQL](https://payloadcms.com/docs/database/postgres) -- db-postgres adapter, db push
- Payload CMS official docs: [Relationship Field](https://payloadcms.com/docs/fields/relationship) -- hasMany, isSortable
- Payload CMS official docs: [Array Field](https://payloadcms.com/docs/fields/array) -- sortable arrays for image ordering

### Secondary (MEDIUM confidence)
- [Build with Matija - Blur Placeholders](https://www.buildwithmatija.com/blog/payload-cms-base64-blur-placeholders-sharp) -- afterChange hook pattern for blurDataURL
- [Build with Matija - Slugs and SKUs](https://www.buildwithmatija.com/blog/payload-cms-slugs-and-skus) -- formatSlug implementation pattern
- [Payload GitHub Discussion #4068](https://github.com/payloadcms/payload/discussions/4068) -- relationship field drag-and-drop reordering
- [Payload GitHub Commit](https://github.com/payloadcms/payload/commit/38a1a38c0c52403083458619b2f9b58044c5c0ea) -- hasMany reordering feature

### Tertiary (LOW confidence)
- Blur placeholder generation: exact Sharp pipeline for base64 generation needs validation with current Payload 3 file storage paths
- `isSortable` on upload hasMany: documented in commits but practical behavior should be verified during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified via npm registry, Payload 3 + Next.js is well-documented
- Architecture: HIGH -- collection configs, access control, and hooks are core Payload patterns with extensive docs
- Pitfalls: HIGH -- derived from domain research and Payload community patterns
- Image processing: MEDIUM -- `imageSizes` + `formatOptions` verified, blur placeholder hook pattern needs runtime validation
- Upload hasMany reordering: MEDIUM -- feature exists per commits, exact admin UX should be tested

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable domain, Payload 3 is mature)
