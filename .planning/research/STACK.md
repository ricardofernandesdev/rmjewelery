# Technology Stack

**Project:** RM Jewelry - Digital Catalog
**Researched:** 2026-03-18
**Overall Confidence:** HIGH

## Decision: Payload CMS 3 + Next.js 16

The core architectural decision is to use **Payload CMS 3** as the backend/admin panel, which natively embeds inside **Next.js**. This gives us a single deployment that contains the public catalog frontend, the REST API, and the full admin panel -- all in one Next.js application. No separate backend server, no API gateway, no CORS configuration.

**Why Payload CMS 3 over alternatives:**

- **Payload 3 embeds directly into Next.js** -- the admin panel runs at `/admin`, the API runs at `/api`, and the public site is the rest of the Next.js app. One deployment, one codebase.
- **TypeScript-first with auto-generated types** from collection schemas. Every field you define in the admin gets a type you can use in the frontend.
- **Built-in rich text editor (Lexical)** -- covers the dynamic pages requirement without third-party WYSIWYG integration.
- **Built-in image upload with focal point, crops, and optimization** -- critical for a jewelry portfolio where image presentation is everything.
- **Built-in REST API auto-generated from collections** -- no need to write API endpoints manually.
- **Single admin user is the default** -- no complex multi-tenant auth. Perfect for a single brand owner.
- **Self-hosted, no vendor lock-in** -- deploy to any Node.js host.

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | ^16.1 | Full-stack framework | App Router with RSC for fast catalog pages, image optimization built-in, single deployment target | HIGH |
| React | ^19.2 | UI library | Required by Next.js 16, Server Components for zero-JS catalog pages | HIGH |
| TypeScript | ^5.9 | Type safety | Payload generates types from schemas, catches errors at build time, essential for maintainability | HIGH |

### CMS / Backend / Admin Panel

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Payload CMS | ^3.79 | Headless CMS + Admin UI + REST API | Embeds into Next.js, TypeScript-native, built-in admin panel at `/admin`, auto-generated REST API, rich text editor, image management. Covers admin panel, API, and content management in one package | HIGH |
| @payloadcms/next | ^3.79 | Next.js integration | Official adapter that wires Payload into Next.js App Router | HIGH |
| @payloadcms/richtext-lexical | ^3.79 | Rich text editor | Lexical-based editor for dynamic pages (cleaning guide, sizing guide, about us). Modern, extensible, built by Meta | HIGH |
| @payloadcms/db-postgres | ^3.79 | Database adapter | PostgreSQL adapter for production. Relational data fits catalog structure (products, categories, collections, pages) | HIGH |
| @payloadcms/plugin-seo | ^3.79 | SEO fields | Adds meta title, description, OG image fields to collections. Essential for a portfolio site that needs to rank | HIGH |

### Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| PostgreSQL | 16+ | Primary database | Relational model fits catalog data perfectly (products belong to categories, collections have products). Payload has first-class Postgres support. Free tier available on Neon/Supabase for initial deployment | HIGH |

### Styling & UI

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | ^4.2 | Utility-first CSS | Rapid styling, excellent for minimalist/luxury aesthetic with precise spacing and typography control. v4 has CSS-first config | HIGH |
| Framer Motion | ^12.38 | Animations | Smooth page transitions, product image galleries, hover effects. The luxury feel requires subtle animations | MEDIUM |
| Lucide React | ^0.577 | Icons | Clean, consistent icon set. Lightweight. Includes Instagram icon for the CTA button | HIGH |

### Image Handling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Sharp | ^0.34 | Image processing | Server-side image optimization, resize, format conversion. Payload uses it internally for upload processing. Next.js uses it for Image component optimization | HIGH |

### Validation & Utilities

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zod | ^4.3 | Schema validation | Validate API inputs, form data, environment variables. TypeScript-native inference | HIGH |

### Dev Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| ESLint | ^9.x | Linting | Code quality, catch bugs early. Next.js includes eslint-config-next | HIGH |
| Prettier | ^3.x | Formatting | Consistent code style across the project | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| CMS | Payload CMS 3 | Strapi 5 | Strapi runs as a separate server (separate deployment, CORS, two processes). Payload embeds in Next.js = simpler architecture for a small project with one developer |
| CMS | Payload CMS 3 | Directus 11 | Directus is great but runs as its own service (Docker). Overkill for this scope. Payload gives same admin panel capabilities inside Next.js |
| CMS | Payload CMS 3 | Sanity / Contentful | Cloud-hosted, vendor lock-in, monthly costs that grow. Self-hosted Payload has zero CMS costs |
| CMS | Payload CMS 3 | Custom admin with React | Weeks of work building CRUD, auth, image upload, rich text editor. Payload gives this out of the box |
| DB | PostgreSQL | SQLite | SQLite works for dev but complicates production deployment (file-based, no concurrent writes). Postgres is free on Neon/Supabase and production-ready |
| DB | PostgreSQL | MongoDB | Payload 3 supports both, but relational data (categories, collections, products) fits Postgres better. No need for document flexibility |
| Styling | Tailwind CSS | Styled Components / CSS Modules | Tailwind is faster for building luxury/minimalist designs. Utility classes make spacing and typography consistent. Industry standard with Next.js |
| Animation | Framer Motion | CSS animations only | CSS can handle basics, but product gallery transitions and page animations benefit from Framer Motion's declarative API |
| Framework | Next.js | Astro | Astro is great for static sites but the admin panel and API needs make Next.js the better fit. Payload requires Next.js anyway |
| Framework | Next.js | Remix | Payload CMS embeds into Next.js specifically. Choosing Remix would mean losing the embedded CMS benefit |

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| Express.js / Fastify (separate API) | Payload auto-generates the REST API inside Next.js. No separate server needed |
| Prisma / Drizzle (ORM) | Payload manages the database layer. Adding another ORM creates conflicts and duplication |
| NextAuth / Auth.js | Payload has built-in authentication for admin users. No public auth needed (visitors don't log in) |
| Redux / Zustand (state management) | Server Components + Payload API means minimal client state. React context is sufficient for any UI state (e.g., gallery lightbox) |
| Cloudinary / Uploadcare | Payload handles image upload, storage, and processing. Add cloud storage later only if local disk becomes insufficient |
| GraphQL | Payload supports it but REST is simpler for this use case. The catalog queries are straightforward (list products, filter by category) |
| Docker (for development) | Adds complexity. Run Next.js + Payload directly with `npm run dev`. Docker only needed if deploying to VPS |
| Tailwind component libraries (shadcn/ui, DaisyUI) | The luxury/minimalist aesthetic requires custom-designed components. Pre-built component libraries impose their own design language |

## Architecture Overview (Stack Perspective)

```
Single Next.js Application
|
|-- /app (public catalog)         -> Server Components, Tailwind, Framer Motion
|   |-- / (homepage)              -> Banners, featured products
|   |-- /products                 -> Catalog grid
|   |-- /products/[slug]          -> Product detail with gallery
|   |-- /categories/[slug]        -> Category listing
|   |-- /collections/[slug]       -> Collection listing
|   |-- /[slug]                   -> Dynamic pages (about, guides)
|
|-- /app/(payload)/admin          -> Payload Admin Panel (auto-generated)
|
|-- /api                          -> Payload REST API (auto-generated)
|   |-- /api/products
|   |-- /api/categories
|   |-- /api/collections
|   |-- /api/pages
|   |-- /api/media
|
|-- /payload.config.ts            -> Collection definitions, plugin config
|
|-- PostgreSQL                    -> All data (products, categories, media, pages, users)
```

## Installation

```bash
# Create project with Payload CMS + Next.js template
npx create-payload-app@latest rmjewelery --template blank --db postgres

# Core dependencies (most included by create-payload-app)
npm install payload @payloadcms/next @payloadcms/richtext-lexical @payloadcms/db-postgres @payloadcms/plugin-seo sharp

# Frontend dependencies
npm install tailwindcss @tailwindcss/postcss framer-motion lucide-react zod

# Dev dependencies
npm install -D typescript @types/node @types/react eslint prettier
```

## Environment Variables

```bash
# Database
DATABASE_URI=postgresql://user:pass@host:5432/rmjewelery

# Payload
PAYLOAD_SECRET=random-secret-string-at-least-32-chars

# App
NEXT_PUBLIC_SITE_URL=https://rmjewelery.com
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/rmjewelery
```

## Deployment Recommendation

For a single-admin jewelry portfolio, the simplest production path:

- **Vercel** (Next.js hosting) -- free tier covers this traffic level, native Next.js support, automatic image optimization
- **Neon PostgreSQL** (database) -- free tier with 0.5GB storage, auto-scaling, branching for dev/prod
- **Local file storage via Vercel Blob** or **Payload local upload** -- for product images. Start with Payload's built-in upload (stores to disk), migrate to Vercel Blob or S3 if needed

Alternative: **VPS (Hetzner/DigitalOcean)** at 4-6 EUR/month with Docker if you want full control and unlimited storage for product images.

## Sources

- npm registry (versions verified 2026-03-18 via `npm view`)
- Payload CMS official description: "Node, React, Headless CMS and Application Framework built on Next.js"
- Payload CMS GitHub: https://github.com/payloadcms/payload
- All version numbers verified against npm registry, not training data
