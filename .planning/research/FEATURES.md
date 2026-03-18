# Feature Landscape

**Domain:** Jewelry brand portfolio / digital catalog (non-ecommerce)
**Researched:** 2026-03-18
**Overall confidence:** MEDIUM-HIGH (stable domain, stack verified via npm registry)

## Table Stakes

Features users expect. Missing = product feels incomplete or unprofessional.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Product gallery with high-quality photos | Jewelry sells visually. Users expect large, crisp images they can examine closely | Medium | Payload handles multi-image upload. Frontend needs lightbox/zoom component |
| Product detail view (name, description, multiple angles) | Users need to evaluate the piece before contacting via Instagram | Low | Dedicated page with image carousel, not a modal |
| Category browsing (Rings, Necklaces, Bracelets, Earrings) | Standard mental model for jewelry. Users browse by product type | Low | Payload collection with relationship to products. URL-based routes for SEO |
| Mobile-first responsive design | 70-80% of traffic comes from Instagram on phones. Mobile is the primary device | Medium | Tailwind responsive utilities. Design mobile-first, enhance for desktop |
| Instagram contact CTA ("Estou interessado") | The entire conversion funnel. Must be obvious and frictionless | Low | Deep link to Instagram DMs via `https://ig.me/m/{username}`. Must work on mobile app and desktop web |
| Homepage with hero banners | First impression sets brand tone. Curated landing experience, not a raw product grid | Low | Payload banners collection with ordering and active/inactive toggle |
| Featured/highlighted products on homepage | Admin spotlights new or popular pieces | Low | Boolean `featured` field on products, or a Payload global for homepage curation |
| Fast image loading | Jewelry photos are heavy. Slow loads kill mobile users | Medium | Sharp processing on upload (multiple sizes, WebP). Next.js Image component with blur placeholder |
| Clean, minimal navigation | Luxury positioning requires restraint. Max 5-6 top-level items | Low | Server-rendered nav from Payload page data |
| SEO fundamentals | Products must be discoverable via Google, not just Instagram | Medium | Payload SEO plugin for meta tags. Next.js SSR/SSG. Structured data. Sitemap |

## Differentiators

Features that elevate beyond a basic catalog. Not expected, but create a premium experience.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Thematic collections (e.g., "Summer 2026") | Groups products by story/campaign. Editorial feel beyond taxonomy | Low | Payload collection with many-to-many product relationship |
| Image zoom / detail view | Let users examine texture, finish, clasp details. Stainless steel has beautiful surface detail | Medium | Pinch-to-zoom on mobile, hover-zoom on desktop. Lightbox with zoom controls |
| Smooth page transitions and micro-animations | Premium luxury feel. Motion creates experience, not just page loads | Medium | Framer Motion. Subtle fade-ins, image reveals. Tasteful, not flashy |
| Dynamic pages system (guides, care, sizing, about) | Admin creates arbitrary pages without developer. Rich text with menu placement | Low | Payload pages collection with Lexical rich text + menu position field (header/footer/none). Payload makes this LOW complexity because Lexical editor is built in |
| Admin analytics dashboard | Know which products get attention. Informs which pieces to feature | Medium | Track page views server-side. Aggregate in admin dashboard. Simple counts, not full analytics |
| Product sharing (link copy, social) | Users share pieces with friends. Generates word-of-mouth | Low | Copy-link button + proper OG tags so shared links preview beautifully |
| "New arrivals" section | Returning visitors see what is new. Shows brand is active | Low | Auto-generated from most recently added products, or admin-curated |
| Blur placeholder image loading | Instead of blank spaces, show blur-up placeholders. Feels polished and intentional | Low | Sharp generates blurDataURL on upload. Next.js Image uses it automatically |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Shopping cart / checkout | Not an e-commerce site. Massive complexity for zero value. Business model is Instagram DM-based | "Estou interessado" button linking to Instagram DMs |
| Price display | Brand decision -- prices given via DM. No price field in the data model at all | No price field. Do not build "just in case" |
| User accounts / registration | Visitors browse anonymously. Accounts add friction, GDPR obligations, and zero value | Payload admin auth is the only authentication |
| Product reviews / ratings | No purchases on-site, so reviews are meaningless. Invites spam and moderation burden | Social proof comes from Instagram followers/engagement |
| Wishlist / favorites | Without accounts, no persistent wishlist. Cookie-based favorites are fragile | If a user likes something, they contact via Instagram |
| Live chat / chatbot | Single-admin brand. Creates expectation of instant response | Instagram DM link. One channel, managed in one place |
| Newsletter / email signup | GDPR complexity, requires email service. Brand communicates via Instagram | Link to Instagram follow |
| Multi-language support | Portuguese market only. Translation maintenance burden | Single language (Portuguese). Add i18n later if needed |
| Complex filtering (price range, material) | No prices. Material is primarily stainless steel. Over-filtering a small catalog creates empty results | Category and collection browsing sufficient for <500 products |
| Blog / content marketing | Content creation burden on single admin. Dynamic pages already cover informational content | Dynamic pages system handles care guides, sizing info, brand story |
| Inventory / stock management | No purchases on-site. Stock status irrelevant to a portfolio | Admin removes or archives unavailable pieces |
| Separate backend API server | Payload embeds REST API in Next.js. Separate server adds deployment complexity, CORS, two processes | Payload auto-generated API at /api/* |
| Custom admin panel | Payload provides admin UI out of the box with CRUD, image management, rich text, auth | Use Payload admin. Customize branding only |

## Feature Dependencies

```
Payload Collections (schema) --> Everything else
Image upload pipeline --> Product gallery, banners, dynamic page images
Product CRUD (admin) --> Product gallery (public), featured products
Category management --> Category browsing
Collection management --> Collection pages
Banner management --> Homepage hero/banners
Lexical rich text editor --> Dynamic pages
Dynamic pages --> Menu positioning (pages placed in header/footer nav)
SEO plugin config --> Meta tags on all public pages
```

## MVP Recommendation

**Phase 1 -- Foundation + Core Catalog:**
1. Payload collections: products, categories, media, users (schema definition)
2. Product CRUD with multi-image upload (Payload admin)
3. Category management (Payload admin)
4. Public catalog: product grid, product detail with gallery
5. Category browsing with clean navigation
6. Instagram DM contact button on every product
7. Mobile-first responsive design (Tailwind)
8. Image optimization pipeline (Sharp sizes, blur placeholders)
9. Payload admin branding (RM Jewelry logo, not Payload default)

**Phase 2 -- Content + Brand Experience:**
1. Homepage with hero banners and featured products
2. Thematic collections (Payload collection, public pages)
3. Dynamic pages with Lexical rich text editor
4. Menu positioning system (header/footer)
5. SEO fundamentals (Payload SEO plugin, OG tags, sitemap)
6. About page as first dynamic page

**Phase 3 -- Polish + Insights:**
1. Image zoom / lightbox on product detail
2. Page transitions and micro-animations (Framer Motion)
3. Product sharing with OG previews
4. "New arrivals" section
5. View tracking infrastructure (server-side)
6. Admin analytics dashboard (most viewed products, category popularity)

**Defer indefinitely:**
- E-commerce features (cart, checkout, payments, inventory)
- User accounts and authentication for visitors
- Multi-language support
- Newsletter / email marketing
- Blog engine

## Complexity Budget

| Complexity | Count | Examples |
|------------|-------|---------|
| Low | 10 features | Contact button, categories, collections, featured products, nav, sharing, new arrivals, blur placeholders, dynamic pages (low with Payload), admin branding |
| Medium | 7 features | Product gallery, image optimization, image zoom, animations, analytics dashboard, mobile-first design, SEO |
| High | 0 features | None -- Payload eliminates the high-complexity dynamic pages/CMS feature by providing it out of the box |

Using Payload CMS reduces the highest-complexity feature (dynamic pages with rich text and menu positioning) from HIGH to LOW because the rich text editor (Lexical), content management, and API are all built in. The main development effort shifts to the public frontend design and user experience.

## Sources

- npm registry (Payload CMS 3.79, Lexical rich text, SEO plugin -- all verified 2026-03-18)
- Payload CMS feature set verified via package descriptions and plugin ecosystem
- Domain knowledge of jewelry brand websites (Mejuri, Ana Luisa, Missoma, Pandora portfolio patterns)
- Luxury brand web design patterns (minimalism, whitespace, visual-first)
