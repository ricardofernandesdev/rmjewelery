# Architecture Patterns

**Domain:** Jewelry catalog / digital portfolio with admin CMS
**Researched:** 2026-03-18
**Confidence:** HIGH (Payload CMS + Next.js is a well-documented, verified pattern)

## Recommended Architecture

**Single Next.js application with embedded Payload CMS.** This is a monolithic architecture -- and that is the correct choice for this project. A single-admin portfolio site does not need microservices, separate API servers, or decoupled frontends. One codebase, one deployment, one process.

```
Browser (Visitor)                    Browser (Admin)
       |                                    |
       v                                    v
+----------------------------------------------+
|            Next.js Application                |
|                                               |
|  /app (public)          /app/(payload)/admin  |
|  - Server Components    - Payload Admin UI    |
|  - Static generation    - React SPA           |
|  - Client islands       - Auth protected      |
|                                               |
|  /api (Payload REST)                          |
|  - Auto-generated CRUD endpoints              |
|  - Media upload handling                      |
|                                               |
|  payload.config.ts                            |
|  - Collection definitions                     |
|  - Plugin configuration                       |
|                                               |
+----------------------------------------------+
              |
              v
      +----------------+
      |  PostgreSQL     |
      |  - Products     |
      |  - Categories   |
      |  - Collections  |
      |  - Pages        |
      |  - Media        |
      |  - Users        |
      +----------------+
```

### Why This Shape

1. **One app, not two frontends.** Payload 3 embeds its admin panel directly inside Next.js at `/admin`. The public catalog is the rest of the Next.js app. No CORS, no separate deployments, no API gateway. This is simpler, cheaper, and easier to maintain for a single developer.

2. **REST over GraphQL.** The data model is simple (products, categories, collections, pages, banners). Payload auto-generates REST endpoints for every collection. REST is sufficient, easier to debug, and has lower complexity. GraphQL adds overhead without benefit here.

3. **Server Components as default.** Catalog pages are read-heavy, interaction-light. Server Components send zero JavaScript for static content -- faster loads, better SEO. Client Components only for interactive elements (gallery, menu toggle, animations).

4. **Image storage separated from database.** Jewelry catalogs are image-heavy. Payload stores images on disk or cloud storage; database stores metadata and paths. Images served directly, not through the API.

## Component Boundaries

| Component | Responsibility | Communicates With | Auth Required |
|-----------|---------------|-------------------|---------------|
| **Public Frontend** (`/app`) | Catalog browsing, product display, dynamic pages, Instagram CTA | Payload Local API (in-process, no HTTP) | No |
| **Admin Panel** (`/app/(payload)/admin`) | Product CRUD, category/collection management, banner management, page editor, analytics | Payload REST API | Yes (admin login) |
| **Payload Config** (`payload.config.ts`) | Data model definitions (collections), access control, hooks, plugins | PostgreSQL via adapter | N/A |
| **REST API** (`/api`) | Auto-generated CRUD endpoints for all collections | PostgreSQL via Payload | Partial (public read + admin write) |
| **PostgreSQL** | Persistent storage | Payload DB adapter | N/A |
| **File Storage** (`/media` or cloud) | Product images, banners, page assets | Payload upload adapter | N/A |

### Boundary Rules

- **Public Frontend uses Payload Local API (not REST).** Direct function calls, no HTTP overhead, fully type-safe.
- **Admin Panel uses Payload REST API.** Standard Payload admin behavior.
- **Public Frontend never writes data.** All mutations happen through admin.
- **Image serving bypasses the API.** Frontends fetch images directly from storage URLs.

## Data Flow

### Public Catalog Browsing (Read Path)

```
User opens /categories/rings
  -> Next.js App Router matches route
  -> Server Component calls payload.find({ collection: 'products', where: { category: 'rings' } })
  -> Payload queries PostgreSQL (in-process, no HTTP)
  -> Server Component renders HTML with product grid
  -> HTML sent to browser (zero or minimal JS)
  -> Browser loads images directly from storage URLs
```

### Product Detail + Instagram CTA

```
User clicks product
  -> Server Component calls payload.findByID or payload.find by slug
  -> Renders product page with all images, description
  -> "Estou interessado" button links to https://ig.me/m/{username}
  -> Optional: afterRead hook increments view count (async)
```

### Admin Creates Product

```
Admin navigates to /admin/collections/products/create
  -> Payload Admin UI renders form from collection schema
  -> Admin fills fields, uploads multiple images
  -> Payload processes images via Sharp (resize, optimize, generate sizes)
  -> Payload stores images to disk/cloud, data to PostgreSQL
  -> afterChange hook calls revalidatePath() to update public pages
```

### Dynamic Page Rendering

```
User navigates to /guia-de-tamanhos
  -> App Router catches /[slug] route
  -> Server Component calls payload.find({ collection: 'pages', where: { slug: 'guia-de-tamanhos' } })
  -> Returns rich text content (Lexical JSON) and menu position
  -> Frontend renders rich text using Payload's rich text renderer
```

### Homepage Assembly

```
User visits /
  -> Server Component makes parallel Payload Local API calls:
     - payload.find({ collection: 'banners', where: { active: true }, sort: 'order' })
     - payload.find({ collection: 'products', where: { featured: true }, limit: 8 })
     - payload.find({ collection: 'products', sort: '-createdAt', limit: 4 })
  -> Renders: hero banners, featured products grid, latest additions
```

### Navigation Assembly

```
Layout component renders header/footer
  -> Server Component calls payload.find({ collection: 'pages', where: { menuPosition: { not_equals: 'none' } } })
  -> Splits pages into header items and footer items
  -> Renders nav links alongside hardcoded routes (home, catalog, categories)
```

## Payload Collections (Data Model)

```typescript
// products
{
  name: string           // "Anel Dourado Classic"
  slug: string           // "anel-dourado-classic" (auto-generated, URL-safe)
  description: richText  // Lexical rich text
  images: upload[]       // Multiple images, first = cover
  category: relationship // -> categories (required, many-to-one)
  collections: relationship[] // -> collections (optional, many-to-many)
  featured: boolean      // Show on homepage
  sortOrder: number      // Display ordering within category
  // SEO fields added by plugin: meta title, meta description, OG image
}

// categories
{
  name: string           // "Aneis"
  slug: string           // "aneis"
  description: text      // Optional category description
  image: upload          // Category cover image
  sortOrder: number      // Menu ordering
}

// collections (thematic)
{
  name: string           // "Colecao Verao 2026"
  slug: string           // "colecao-verao-2026"
  description: richText  // Collection story/description
  image: upload          // Collection cover image
  sortOrder: number      // Display ordering
}

// pages (dynamic)
{
  title: string          // "Guia de Tamanhos"
  slug: string           // "guia-de-tamanhos"
  content: richText      // Lexical rich text (headings, text, images, lists)
  menuPosition: select   // 'header' | 'footer' | 'none'
  sortOrder: number      // Order within menu
  published: boolean     // Draft/published toggle
  // SEO fields added by plugin
}

// banners
{
  title: string          // Optional overlay text
  subtitle: string       // Optional overlay text
  image: upload          // Banner image (full-width)
  link: text             // Optional URL (to collection, category, or product)
  sortOrder: number      // Carousel ordering
  active: boolean        // Show/hide without deleting
}

// media (auto-managed by Payload)
{
  // Payload auto-generates: filename, mimeType, filesize, width, height, sizes (thumbnails)
  alt: text              // Alt text for accessibility/SEO
  // Sharp generates: thumbnail (400px), card (800px), detail (1600px), zoom (2400px)
}

// users (Payload built-in)
{
  email: string
  password: hashed
  // Single admin user, seeded on first setup
}
```

## Key Architectural Patterns

### Pattern 1: Server Components First

**What:** Default all public pages to React Server Components. Only use Client Components for interactive islands.

**When:** Every page that displays catalog data.

**Why:** Zero JavaScript shipped for static content. Faster loads, better SEO, simpler code.

**Client Component islands needed for:**
- Product image gallery (swipe, zoom, lightbox)
- Mobile hamburger menu toggle
- Framer Motion animations
- Any form interactions

### Pattern 2: Payload Local API in Server Components

**What:** Use `payload.find()`, `payload.findByID()` directly in Server Components instead of HTTP fetch.

**Why:** In-process call = no HTTP overhead, no serialization, no CORS. Faster and fully typed.

```typescript
// CORRECT: Local API (in Server Components)
const payload = await getPayload({ config })
const products = await payload.find({ collection: 'products', limit: 20 })

// WRONG: Unnecessary HTTP round-trip
const res = await fetch('/api/products?limit=20')
```

### Pattern 3: Revalidation via Collection Hooks

**What:** When admin changes content, Payload hooks trigger Next.js cache revalidation for affected public pages.

**Why:** Static/ISR pages need explicit cache invalidation. Without hooks, admin changes don't appear until cache expires.

```typescript
// In collection config
hooks: {
  afterChange: [({ doc }) => {
    revalidatePath(`/products/${doc.slug}`)
    revalidatePath('/') // homepage may show featured products
  }]
}
```

### Pattern 4: Sort Order as Explicit Field

**What:** Every orderable entity has an explicit `sortOrder` number field.

**When:** Categories in nav, products within a category, banners in carousel, pages in menu.

**Why:** The admin needs creative control over display order. Default to creation date but allow manual override.

### Pattern 5: Slug-Based Public Routing

**What:** All public URLs use slugs, not database IDs.

**Why:** SEO-friendly, human-readable, stable. Auto-generate from name with diacritics stripped.

```
/products/anel-dourado-classic  (not /products/123)
/categories/aneis               (not /categories/5)
/colecao-verao-2026             (not /collections/7)
/guia-de-tamanhos               (not /pages/12)
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Fetching REST API from Server Components
**What:** Using `fetch('/api/products')` in Server Components.
**Why bad:** Unnecessary HTTP round-trip when Payload Local API is available in the same process.
**Instead:** Use `payload.find()`, `payload.findByID()` directly.

### Anti-Pattern 2: Client Components for Static Content
**What:** Making product listing or category pages Client Components.
**Why bad:** Ships unnecessary JavaScript for content that has zero interactivity.
**Instead:** Server Components for layout and data. Client Components only for gallery, animations, menu toggle.

### Anti-Pattern 3: Custom API Routes for CRUD
**What:** Writing Next.js API routes to wrap Payload operations.
**Why bad:** Payload already auto-generates REST endpoints for every collection. Custom routes duplicate logic.
**Instead:** Use Payload's `/api/[collection]` endpoints. Customize with collection hooks.

### Anti-Pattern 4: Storing Images in the Database
**What:** Putting image binary data in PostgreSQL.
**Why bad:** Bloats database, slow queries, expensive backups.
**Instead:** Payload stores images on disk/cloud. Database stores metadata and paths.

### Anti-Pattern 5: Over-Engineering State Management
**What:** Adding Redux/Zustand for a catalog site.
**Why bad:** Server Components eliminate most client state. The few interactive pieces (gallery, menu) need local component state at most.
**Instead:** React useState/useContext for the rare client-side state.

### Anti-Pattern 6: Building Custom Admin UI
**What:** Creating custom React admin pages instead of using Payload's generated admin.
**Why bad:** Weeks of work building CRUD forms, validation, image upload, auth screens that Payload provides out of the box.
**Instead:** Use Payload admin. Customize branding (logo, colors). Only build custom admin components if Payload truly cannot handle a specific need.

## Scalability Considerations

| Concern | At launch (<100/day) | At 1K/day | At 10K+/day |
|---------|---------------------|-----------|-------------|
| Page loads | Static generation handles it | ISR + CDN | Same, CDN scales automatically |
| Images | Local disk or Vercel Blob | Same | Move to S3 + CloudFront if needed |
| Database | Neon free tier | Neon free tier still fine | Neon paid ($19/mo) |
| Admin perf | Single user, no issues | Still single user | Still single user |
| Search | Category browsing sufficient | Add basic text search | Consider Meilisearch if catalog is huge |

**Honest assessment:** This site will likely never need to scale beyond a single deployment. A portfolio with hundreds of products and one admin user is well within comfortable limits. Optimize for simplicity and maintainability, not horizontal scaling.

## File Structure

```
rmjewelery/
  /app
    /(frontend)          # Public catalog (route group)
      /page.tsx          # Homepage
      /products
        /page.tsx        # Catalog grid
        /[slug]
          /page.tsx      # Product detail
      /categories
        /[slug]
          /page.tsx      # Category listing
      /collections
        /[slug]
          /page.tsx      # Collection listing
      /[slug]
        /page.tsx        # Dynamic pages (catch-all for admin-created pages)
      /layout.tsx        # Public layout (nav, footer)
    /(payload)
      /admin             # Payload admin panel (auto-configured)
        /[[...segments]]
          /page.tsx
      /api               # Payload REST API routes
        /[...slug]
          /route.ts
  /collections           # Payload collection configs
    /Products.ts
    /Categories.ts
    /Collections.ts
    /Pages.ts
    /Banners.ts
    /Media.ts
  /components            # Shared React components
    /ui                  # Base UI components
    /product             # Product-specific (gallery, card, grid)
    /layout              # Header, footer, nav
  /lib                   # Utilities
    /payload.ts          # Payload client helper
    /utils.ts            # Shared utilities
  /public                # Static assets (favicon, fonts)
  /media                 # Uploaded files (Payload manages)
  payload.config.ts      # Main Payload configuration
  tailwind.config.ts     # Tailwind configuration
  next.config.ts         # Next.js configuration
```

## Sources

- Payload CMS 3 architecture: embedded Next.js pattern (verified via npm -- "Node, React, Headless CMS and Application Framework built on Next.js")
- Payload packages verified: payload@3.79, @payloadcms/next@3.79, @payloadcms/richtext-lexical@3.79, @payloadcms/db-postgres@3.79, @payloadcms/plugin-seo@3.79
- Next.js 16 App Router with Server Components pattern (established since Next.js 13+, current version verified at 16.1.7)
- Architecture decisions driven by project requirements in PROJECT.md
