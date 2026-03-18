# Phase 2: Product Catalog - Research

**Researched:** 2026-03-18
**Domain:** Next.js 15 App Router frontend with Payload CMS 3 Local API, Tailwind CSS 4, responsive catalog UI
**Confidence:** HIGH

## Summary

Phase 2 transforms the Payload CMS backend (built in Phase 1) into a public-facing jewelry catalog. The core work is building Next.js App Router pages that fetch data via Payload Local API and render a responsive, photo-forward catalog with category filtering, product detail pages, and an Instagram DM contact button. This is a frontend-heavy phase operating entirely within an established backend.

The technical foundation is solid: Payload CMS 3.79 is already configured with Products, Categories, and Media collections. The Local API pattern (`getPayload()` then `payload.find()`) is the standard approach for Server Components -- no HTTP round-trips, fully typed. Tailwind CSS 4 needs to be installed (not yet in the project) with its new CSS-first configuration. The Instagram deep link (`ig.me/m/{username}`) works cross-platform but has known desktop web inconsistencies that require a visible fallback.

**Primary recommendation:** Build mobile-first Server Components using Payload Local API for data, Tailwind CSS 4 for styling, and a simple inline SVG for the Instagram icon (Lucide deprecated brand icons). Keep Client Components minimal -- only for mobile nav toggle and image gallery interactions.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CAT-01 | User can browse products in a photo-forward grid layout | Payload Local API `payload.find({ collection: 'products' })` with `depth: 1` to populate images. Next.js Image component with `blurDataURL` from Media collection. Tailwind CSS grid (2-col mobile, 3-4 col desktop). |
| CAT-02 | User can view product detail page with name, description, and multiple photo angles | Dynamic route `/products/[slug]` with `generateStaticParams`. Payload `payload.find({ where: { slug } })`. Rich text rendering via `@payloadcms/richtext-lexical/react` RichText component. Multiple images from product `images` array. |
| CAT-03 | User can browse products by category | Route `/categories/[slug]` fetching category then filtering products by category relationship. Category nav derived from `payload.find({ collection: 'categories', sort: 'sortOrder' })`. |
| CONT-01 | User can tap "Estou interessado" button with Instagram icon to open Instagram DMs | `https://ig.me/m/{username}` link. Inline SVG Instagram icon (Lucide deprecated brand icons). Button styled as primary CTA. Instagram username from environment variable. |
| CONT-02 | Instagram DM redirect works on iOS, Android, and desktop browsers | `ig.me/m/` format works cross-platform. Display `@username` text as visible fallback for desktop web edge cases. Link opens as `target="_blank" rel="noopener"`. |
| HOME-03 | User experiences clean, minimal navigation with max 5-6 top-level items | Responsive header with logo, nav links (Inicio, Catalogo, category items), mobile hamburger. Footer with brand info + Instagram link. Max 5-6 items enforced by hardcoded nav structure. |
| HOME-04 | Site is fully responsive and mobile-first | Tailwind CSS 4 mobile-first breakpoints. 2-column grid on mobile, 3-4 on desktop. Touch targets 44x44px minimum. Test in Instagram in-app browser. |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.4.11 | App Router, Server Components, Image optimization | Already installed; pages, dynamic routes, generateStaticParams, generateMetadata |
| React | ^19.1 | UI rendering | Already installed; Server Components by default |
| Payload CMS | ^3.79 | Local API for data fetching | Already installed; `payload.find()` in Server Components |
| @payloadcms/richtext-lexical | ^3.79 | Rich text rendering | Already installed; `RichText` component from `@payloadcms/richtext-lexical/react` |
| Sharp | ^0.34 | Image optimization | Already installed; Next.js Image component uses it |

### New Dependencies (Phase 2)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | ^4.x | Utility-first CSS framework | All styling; CSS-first config in v4, no JS config file needed |
| @tailwindcss/postcss | ^4.x | PostCSS plugin for Tailwind | Required for Next.js integration |
| postcss | latest | CSS processing | Required by @tailwindcss/postcss |

### NOT Adding (Intentional Omissions)
| Instead of | Why Not | What to Do Instead |
|------------|---------|-------------------|
| lucide-react (for Instagram icon) | Lucide deprecated all brand/social icons (Instagram, Facebook, etc.) as of v0.475.0 | Use an inline SVG for the Instagram icon (simple 24x24 path) |
| react-icons | Heavy package for a single icon | Inline SVG is lighter and avoids adding a dependency for one icon |
| Framer Motion | Not needed in Phase 2 (animations are Phase 6) | CSS transitions for hover effects are sufficient |
| Any state management | Server Components eliminate most client state | React useState for mobile menu toggle only |

**Installation:**
```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    (frontend)/              # Route group for public pages
      layout.tsx             # Public layout: header, nav, footer
      page.tsx               # Homepage (minimal for Phase 2, enhanced in Phase 3)
      products/
        page.tsx             # Catalog grid (all products)
        [slug]/
          page.tsx           # Product detail
      categories/
        [slug]/
          page.tsx           # Category listing (filtered products)
    (payload)/               # Existing: admin panel + API
      ...
    layout.tsx               # Root layout (html/body, lang="pt")
    globals.css              # Tailwind CSS entry point
  components/
    layout/
      Header.tsx             # Site header with nav (Server Component)
      MobileNav.tsx          # Mobile hamburger menu (Client Component)
      Footer.tsx             # Site footer (Server Component)
    product/
      ProductCard.tsx        # Product card for grid (Server Component)
      ProductGrid.tsx        # Grid container (Server Component)
      ProductGallery.tsx     # Image gallery on detail page (Client Component for swipe)
      InstagramCTA.tsx       # "Estou interessado" button (Server Component)
    ui/
      Container.tsx          # Max-width wrapper
  lib/
    payload.ts               # Existing: getPayload helper
    access.ts                # Existing: isAdmin
    slugFormat.ts            # Existing: slug generation
    queries.ts               # Payload query helpers (typed wrappers)
```

### Pattern 1: Server Components with Payload Local API
**What:** All page components are Server Components that call Payload Local API directly.
**When to use:** Every page that displays catalog data.
**Example:**
```typescript
// src/app/(frontend)/products/page.tsx
import { getPayload } from '@/lib/payload'
import { ProductGrid } from '@/components/product/ProductGrid'

export default async function CatalogPage() {
  const payload = await getPayload()
  const { docs: products } = await payload.find({
    collection: 'products',
    limit: 50,
    sort: 'sortOrder',
    depth: 1, // populates category and images
  })
  return <ProductGrid products={products} />
}
```
Source: Payload CMS Local API docs (https://payloadcms.com/docs/local-api/overview)

### Pattern 2: Dynamic Routes with generateStaticParams
**What:** Product and category detail pages use `[slug]` dynamic segments with optional static generation.
**When to use:** `/products/[slug]` and `/categories/[slug]` pages.
**Example:**
```typescript
// src/app/(frontend)/products/[slug]/page.tsx
import { getPayload } from '@/lib/payload'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'products',
    limit: 1000,
    select: { slug: true },
  })
  return docs.map((doc) => ({ slug: doc.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const product = docs[0]
  if (!product) return {}
  return {
    title: product.name,
    description: `${product.name} - RM Jewelry`,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2, // populate images with sizes, category
  })
  if (!docs[0]) notFound()
  return <ProductDetail product={docs[0]} />
}
```
Source: Next.js generateStaticParams docs (https://nextjs.org/docs/app/api-reference/functions/generate-static-params)

### Pattern 3: Next.js Image with Payload Media blurDataURL
**What:** Use Next.js `<Image>` component with the `blurDataURL` field from Media collection for blur-up placeholders.
**When to use:** Every product image display.
**Example:**
```typescript
// In ProductCard or ProductGallery
import Image from 'next/image'

// media is a populated Payload Media document
<Image
  src={media.sizes?.card?.url || media.url}
  alt={media.alt}
  width={media.sizes?.card?.width || media.width}
  height={media.sizes?.card?.height || media.height}
  placeholder={media.blurDataURL ? 'blur' : 'empty'}
  blurDataURL={media.blurDataURL || undefined}
  className="object-cover aspect-square"
/>
```
Source: Next.js Image component docs (https://nextjs.org/docs/app/api-reference/components/image)

### Pattern 4: Rich Text Rendering with Lexical
**What:** Render product descriptions using Payload's built-in RichText JSX converter.
**When to use:** Product detail page description field.
**Example:**
```typescript
import { RichText } from '@payloadcms/richtext-lexical/react'

// In product detail page
{product.description && (
  <RichText data={product.description} />
)}
```
Source: Payload rich text rendering guide (https://payloadcms.com/posts/guides/how-to-render-rich-text-from-payload-in-a-nextjs-frontend)

### Pattern 5: Instagram CTA Button
**What:** A button linking to `ig.me/m/{username}` with an inline SVG Instagram icon and visible username fallback.
**When to use:** Product detail pages and optionally in the footer.
**Example:**
```typescript
// src/components/product/InstagramCTA.tsx
const INSTAGRAM_USERNAME = process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME || 'rmjewelery'

export function InstagramCTA() {
  return (
    <a
      href={`https://ig.me/m/${INSTAGRAM_USERNAME}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors"
    >
      {/* Inline SVG Instagram icon */}
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
      Estou interessado
      <span className="text-sm opacity-75">@{INSTAGRAM_USERNAME}</span>
    </a>
  )
}
```

### Pattern 6: Tailwind CSS 4 Configuration (CSS-first)
**What:** Tailwind v4 uses CSS-based configuration instead of `tailwind.config.js`.
**When to use:** Project setup; all custom design tokens (colors, fonts, spacing).
**Example:**
```css
/* src/app/globals.css */
@import 'tailwindcss';

/* Custom design tokens for luxury jewelry aesthetic */
@theme {
  --color-brand-gold: #C9A961;
  --color-brand-dark: #1A1A1A;
  --color-brand-cream: #F5F0EB;
  --color-brand-gray: #6B6B6B;

  --font-heading: 'system-ui', serif;
  --font-body: 'system-ui', sans-serif;
}
```

PostCSS config:
```javascript
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```
Source: Tailwind CSS v4 installation guide (https://tailwindcss.com/docs/installation/using-postcss)

### Anti-Patterns to Avoid
- **Fetching via REST API in Server Components:** Use `payload.find()` Local API, not `fetch('/api/products')`. Local API is in-process, zero HTTP overhead.
- **Making catalog pages Client Components:** Product grid and detail pages should be Server Components. Zero JavaScript shipped for static content.
- **Using `'use client'` on the layout:** The `(frontend)/layout.tsx` should be a Server Component. Only `MobileNav.tsx` (hamburger toggle) needs `'use client'`.
- **Hardcoding Instagram username:** Use `NEXT_PUBLIC_INSTAGRAM_USERNAME` env var so it is changeable without code changes.
- **Missing `depth` parameter in queries:** Without `depth: 1+`, relationship fields (images, category) return IDs, not populated objects.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rich text rendering | Custom Lexical JSON-to-HTML parser | `@payloadcms/richtext-lexical/react` RichText component | Handles all node types, headings, links, lists, images. Custom parser misses edge cases |
| Image optimization | Custom Sharp pipeline for frontend | Next.js `<Image>` component with Payload Media URLs | Built-in lazy loading, format negotiation, responsive srcset, blur placeholders |
| Responsive grid | Custom CSS grid with media queries | Tailwind CSS `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4` | Battle-tested responsive breakpoints, utility classes compose faster |
| Data fetching layer | Custom API wrapper / tRPC / React Query | Payload Local API directly in Server Components | In-process, typed, zero overhead. Adding a layer adds complexity without value |
| Slug-based routing | Custom slug resolver | Next.js `[slug]` dynamic segments + Payload `where: { slug: { equals } }` | Standard Next.js pattern, automatic code splitting |
| Page metadata / SEO | Manual `<head>` tags | Next.js `generateMetadata` function | Type-safe, automatic merging with layout metadata, OG tags built-in |

**Key insight:** The entire frontend stack (Next.js App Router + Payload Local API + Tailwind CSS) provides all the primitives needed. The risk in this phase is not missing technology but over-engineering simple components.

## Common Pitfalls

### Pitfall 1: Missing `depth` in Payload Queries
**What goes wrong:** Product images and category fields return as string IDs instead of populated objects. Frontend crashes trying to access `image.url`.
**Why it happens:** Payload defaults to `depth: 0` for performance. Relationships are not populated unless you ask.
**How to avoid:** Always set `depth: 1` (or `depth: 2` if you need nested relationships like image sizes). For product grids, `depth: 1` is sufficient. For product detail with full media objects, use `depth: 2`.
**Warning signs:** TypeScript errors about accessing properties on `string | Media` union types.

### Pitfall 2: Next.js Image with Payload Media URLs
**What goes wrong:** Next.js `<Image>` rejects Payload media URLs as "unrecognized domain" or renders broken images.
**Why it happens:** Next.js Image requires explicit hostname configuration for remote images. Payload media URLs may be relative paths (e.g., `/media/filename.webp`) or absolute URLs depending on storage configuration.
**How to avoid:** For local storage (current setup), use relative URLs which Next.js handles natively. If/when moving to cloud storage, add the hostname to `next.config.ts` `images.remotePatterns`. Always use the `sizes` sub-object URLs (e.g., `media.sizes.card.url`) not the root `media.url` for optimized versions.
**Warning signs:** 404 errors on images, or images not showing in the grid.

### Pitfall 3: Instagram In-App Browser Layout Issues
**What goes wrong:** CSS `position: fixed` elements (like sticky headers) behave erratically in Instagram's WebView. `vh` units are wrong because Instagram's bottom bar shifts.
**Why it happens:** Instagram's in-app browser is a WebView with non-standard viewport behavior.
**How to avoid:** Use `dvh` (dynamic viewport height) instead of `vh`. Avoid `position: fixed` for critical layout elements -- use `position: sticky` instead. Test by sharing a link in Instagram DM and opening in-app.
**Warning signs:** Header overlapping content, footer hidden behind Instagram's bottom bar.

### Pitfall 4: Forgetting `revalidatePath` in Collection Hooks
**What goes wrong:** Admin updates a product name or image, but the public catalog still shows old content.
**Why it happens:** The Products collection has a TODO comment for revalidation in afterChange hook (from Phase 1). Must be implemented in Phase 2.
**How to avoid:** Implement `revalidatePath` and `revalidateTag` in Products and Categories afterChange hooks. Revalidate: the specific product page, the catalog page, category pages, and homepage.
**Warning signs:** Admin changes content, refreshes public site, sees old data.

### Pitfall 5: Tailwind CSS 4 with Payload Admin Styles Conflict
**What goes wrong:** Tailwind's preflight/reset CSS interferes with Payload admin panel styles, breaking the admin UI.
**Why it happens:** Tailwind v4 applies global CSS resets. If `globals.css` is imported in the root layout, it affects the `(payload)` route group too.
**How to avoid:** Import `globals.css` only in the `(frontend)/layout.tsx`, NOT in the root `layout.tsx`. The `(payload)` route group has its own layout with Payload's SCSS. Keep them separated.
**Warning signs:** Payload admin panel looks broken (missing borders, wrong fonts, button styles lost).

### Pitfall 6: Route Group Collision with Dynamic [slug]
**What goes wrong:** A catch-all `[slug]` page at the root level intercepts routes meant for other pages (like `/products` or `/categories`).
**Why it happens:** Next.js route matching order. A `[slug]/page.tsx` at `(frontend)/` level would match before `products/page.tsx`.
**How to avoid:** Do NOT create a `[slug]/page.tsx` at the `(frontend)` root in Phase 2. Dynamic pages (`[slug]`) are a Phase 4 feature. Keep routes explicit: `/products`, `/products/[slug]`, `/categories/[slug]`.
**Warning signs:** Navigating to `/products` renders the wrong page.

## Code Examples

### Payload Query Helpers
```typescript
// src/lib/queries.ts
import { getPayload } from '@/lib/payload'

export async function getAllProducts(limit = 50) {
  const payload = await getPayload()
  return payload.find({
    collection: 'products',
    limit,
    sort: 'sortOrder',
    depth: 1,
  })
}

export async function getProductBySlug(slug: string) {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  return docs[0] || null
}

export async function getProductsByCategory(categoryId: string, limit = 50) {
  const payload = await getPayload()
  return payload.find({
    collection: 'products',
    where: { category: { equals: categoryId } },
    limit,
    sort: 'sortOrder',
    depth: 1,
  })
}

export async function getAllCategories() {
  const payload = await getPayload()
  return payload.find({
    collection: 'categories',
    sort: 'sortOrder',
    depth: 1,
  })
}

export async function getCategoryBySlug(slug: string) {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return docs[0] || null
}
```

### Responsive Product Grid
```typescript
// src/components/product/ProductGrid.tsx
import { ProductCard } from './ProductCard'

export function ProductGrid({ products }: { products: any[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

### Product Card with Blur Placeholder
```typescript
// src/components/product/ProductCard.tsx
import Image from 'next/image'
import Link from 'next/link'

export function ProductCard({ product }: { product: any }) {
  const coverImage = Array.isArray(product.images) ? product.images[0] : null
  const category = typeof product.category === 'object' ? product.category : null

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-sm bg-brand-cream">
        {coverImage && typeof coverImage === 'object' && (
          <Image
            src={coverImage.sizes?.card?.url || coverImage.url}
            alt={coverImage.alt || product.name}
            width={coverImage.sizes?.card?.width || 800}
            height={coverImage.sizes?.card?.height || 800}
            placeholder={coverImage.blurDataURL ? 'blur' : 'empty'}
            blurDataURL={coverImage.blurDataURL || undefined}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="mt-2 px-1">
        <h3 className="text-sm font-medium text-brand-dark truncate">{product.name}</h3>
        {category && (
          <p className="text-xs text-brand-gray">{category.name}</p>
        )}
      </div>
    </Link>
  )
}
```

### Revalidation Hook (Update Products Collection)
```typescript
// Updated afterChange hook for src/collections/Products.ts
import { revalidatePath, revalidateTag } from 'next/cache'

afterChange: [
  ({ doc }) => {
    revalidatePath(`/products/${doc.slug}`)
    revalidatePath('/products')
    revalidatePath('/')
    // If category is populated, revalidate category page too
    if (typeof doc.category === 'object' && doc.category?.slug) {
      revalidatePath(`/categories/${doc.category.slug}`)
    }
    return doc
  },
],
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js | CSS-first config with `@theme {}` | Tailwind CSS v4 (Jan 2025) | No JS config file. All customization in CSS. Automatic content detection |
| `getStaticPaths` + `getStaticProps` | `generateStaticParams` + async Server Components | Next.js 13+ App Router | Direct data fetching in components, no separate data functions |
| lucide-react brand icons | Inline SVG or react-icons | Lucide v0.475 (Feb 2025) | Instagram, Facebook, GitHub icons deprecated. Must use alternative |
| `getPayloadHMR` | `getPayload` (HMR built-in) | Payload 3.x | Single function handles both dev HMR and production |
| Manual `<head>` meta tags | `generateMetadata` / `metadata` export | Next.js 13+ | Type-safe metadata with automatic merging across layout hierarchy |
| Next.js `params` as sync prop | `params` as `Promise` (must `await`) | Next.js 15 | `{ params }: { params: Promise<{ slug: string }> }` -- must await params |

**Deprecated/outdated:**
- `getPayloadHMR` from `@payloadcms/next/utilities` -- use `getPayload` from `payload` instead
- Lucide brand icons (Instagram, Facebook, etc.) -- use inline SVGs
- `tailwind.config.js` -- Tailwind v4 uses CSS-first config (JS config still supported but not recommended)

## Open Questions

1. **Image URL format with local storage**
   - What we know: Media collection stores to `media/` directory. Payload serves files at `/media/filename.webp`. Sizes are at `/media/filename-400x400.webp` (or similar).
   - What's unclear: Exact URL pattern for `sizes` sub-object in Payload response. Need to verify at runtime.
   - Recommendation: Log a sample product query during development to inspect the exact URL structure. Build image components to handle both relative and absolute URLs.

2. **Font selection for luxury aesthetic**
   - What we know: Design calls for "minimalista/luxo" -- clean, whitespace, elegant typography.
   - What's unclear: Specific font choice not decided. System fonts vs Google Fonts vs self-hosted.
   - Recommendation: Start with `font-sans` (system UI) for body and a serif for headings. Can swap to a specific font later without structural changes. Avoid Google Fonts initially to keep page speed fast.

3. **Category navigation placement**
   - What we know: HOME-03 requires max 5-6 top-level items. Categories include Aneis, Colares, Pulseiras, Brincos, etc.
   - What's unclear: Whether categories should appear directly in the top nav, in a dropdown, or only on the catalog page as filters.
   - Recommendation: If categories are 4-5, include them directly in the nav. If more, use a "Catalogo" nav item that links to `/products` where categories are displayed as filter tabs/pills.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1 |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAT-01 | Product grid renders with images | integration | `npx vitest run tests/pages/catalog.test.ts -t "renders product grid"` | Wave 0 |
| CAT-02 | Product detail page renders with description and images | integration | `npx vitest run tests/pages/product-detail.test.ts -t "renders product detail"` | Wave 0 |
| CAT-03 | Category page filters products correctly | integration | `npx vitest run tests/pages/category.test.ts -t "filters by category"` | Wave 0 |
| CONT-01 | Instagram CTA button renders with correct href | unit | `npx vitest run tests/components/instagram-cta.test.ts` | Wave 0 |
| CONT-02 | Instagram link format is ig.me/m/{username} | unit | `npx vitest run tests/components/instagram-cta.test.ts -t "ig.me format"` | Wave 0 |
| HOME-03 | Navigation renders with max 5-6 items | unit | `npx vitest run tests/components/header.test.ts -t "nav items"` | Wave 0 |
| HOME-04 | Responsive CSS classes applied correctly | manual-only | Visual inspection on mobile/tablet/desktop | N/A (CSS) |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/pages/catalog.test.ts` -- covers CAT-01 (product grid rendering)
- [ ] `tests/pages/product-detail.test.ts` -- covers CAT-02 (product detail page)
- [ ] `tests/pages/category.test.ts` -- covers CAT-03 (category filtering)
- [ ] `tests/components/instagram-cta.test.ts` -- covers CONT-01, CONT-02
- [ ] `tests/components/header.test.ts` -- covers HOME-03 (navigation)

Note: Integration tests for page rendering may require testing the Payload query layer rather than full Next.js page rendering, since Server Components are not easily unit-testable. Focus tests on: (1) query helpers return correct data shapes, (2) component rendering with mock data, (3) Instagram link format correctness.

## Sources

### Primary (HIGH confidence)
- Payload CMS Local API docs: https://payloadcms.com/docs/local-api/overview -- data fetching patterns
- Payload rich text rendering: https://payloadcms.com/posts/guides/how-to-render-rich-text-from-payload-in-a-nextjs-frontend -- RichText component usage
- Next.js Image component: https://nextjs.org/docs/app/api-reference/components/image -- blurDataURL, sizes, optimization
- Next.js generateStaticParams: https://nextjs.org/docs/app/api-reference/functions/generate-static-params -- dynamic route prerendering
- Next.js generateMetadata: https://nextjs.org/docs/app/api-reference/functions/generate-metadata -- page metadata
- Tailwind CSS v4 PostCSS install: https://tailwindcss.com/docs/installation/using-postcss -- CSS-first setup
- Tailwind CSS v4 Next.js guide: https://tailwindcss.com/docs/guides/nextjs -- framework-specific steps

### Secondary (MEDIUM confidence)
- Instagram ig.me/m/ link behavior: multiple sources confirm cross-platform functionality as of 2026, but Meta officially states web support is limited
- Lucide brand icon deprecation: https://github.com/lucide-icons/lucide/issues/2792 -- confirmed deprecated since v0.475

### Tertiary (LOW confidence)
- Instagram in-app browser viewport quirks: known issue but specific CSS workarounds vary by device/OS version. Test on real devices.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified, versions confirmed, installation paths clear
- Architecture: HIGH - Payload Local API + Next.js App Router is the documented, intended pattern
- Pitfalls: HIGH - Based on known issues from Phase 1 experience and documented Payload/Next.js behaviors
- Instagram deep link: MEDIUM - Works cross-platform but Meta's official stance on web support is ambiguous
- Tailwind v4 + Payload conflict: MEDIUM - Logical concern based on CSS reset behavior, needs verification

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable domain, 30 days)
