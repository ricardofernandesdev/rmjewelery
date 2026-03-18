# Research Summary: RM Jewelry - Digital Catalog

**Domain:** Jewelry brand portfolio / digital catalog (non-ecommerce)
**Researched:** 2026-03-18
**Overall confidence:** HIGH

## Executive Summary

The RM Jewelry project is a brand portfolio website for a stainless steel jewelry brand targeting the Portuguese market. The site serves as a digital showcase where visitors browse the catalog and contact the brand via Instagram DMs -- no e-commerce, no user accounts, no payments. It requires a public catalog frontend, an admin panel for content management, and a REST API connecting them.

The defining architectural decision is to use **Payload CMS 3 embedded inside Next.js 16**. Payload 3 is a headless CMS that runs as a Next.js plugin rather than a separate server. This means the admin panel (at `/admin`), the REST API (at `/api`), and the public catalog all live in a single Next.js application. One codebase, one deployment, one process. This eliminates the complexity of running separate frontend and backend servers, configuring CORS, managing two deployments, and building a custom admin panel from scratch.

Payload provides out-of-the-box: auto-generated admin UI with CRUD for all collections, built-in authentication, Lexical rich text editor (for dynamic pages), multi-image upload with Sharp processing, auto-generated REST API endpoints, TypeScript type generation from schemas, and an SEO plugin. This reduces the highest-complexity feature in the project (dynamic pages with rich text and menu positioning) from weeks of custom development to configuration.

The technology stack is deliberately minimal: Next.js 16, React 19, TypeScript, Payload CMS 3, PostgreSQL, Tailwind CSS 4, Framer Motion for animations, and Sharp for image processing. All versions verified against npm registry on 2026-03-18. The project explicitly avoids: separate backend servers, ORMs (Payload manages the database), state management libraries, component libraries (luxury aesthetic requires custom design), and any e-commerce tooling.

## Key Findings

**Stack:** Payload CMS 3 + Next.js 16 as a unified application. PostgreSQL for data. Tailwind CSS 4 for styling. All verified current as of 2026-03-18.

**Architecture:** Single monolithic Next.js app with Payload embedded. Server Components for public pages (zero JS), Client Components only for interactive islands (gallery, animations). Payload Local API for data fetching in Server Components (in-process, no HTTP).

**Critical pitfall:** Image quality vs performance tradeoff is the highest-risk technical challenge. Jewelry photography needs higher quality than typical web images, but mobile users from Instagram need fast loads. Must configure Sharp with jewelry-specific sizes and quality settings, tested with real product photos.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation + Core Catalog** - Get products browsable on mobile
   - Addresses: Payload collections (schema), product CRUD, category browsing, Instagram CTA, mobile-first design, image pipeline
   - Avoids: Schema changes after building UI (Pitfall #3), open API access (Pitfall #6)
   - Rationale: Must define data model first. Must have products in the system before anything else makes sense. Mobile-first from day one prevents expensive redesign.

2. **Content + Brand Experience** - Make the site feel like a luxury brand
   - Addresses: Homepage banners, featured products, thematic collections, dynamic pages, menu positioning, SEO
   - Avoids: Over-engineering page builder (Pitfall #10), no link previews (Pitfall #12)
   - Rationale: With the catalog working, add the brand experience layer. Dynamic pages give the admin autonomy. SEO should be in place before public launch.

3. **Polish + Insights** - Refine the experience and add analytics
   - Addresses: Image zoom/lightbox, page transitions (Framer Motion), view tracking, admin analytics dashboard, "new arrivals"
   - Avoids: No historical analytics data (collecting before dashboard is built), missing zoom hurting product evaluation
   - Rationale: Polish features that enhance but don't block launch. Analytics tracking should start even if dashboard comes later.

**Phase ordering rationale:**
- Phase 1 before Phase 2: Cannot build homepage with featured products before products exist. Cannot build collection pages before collections exist.
- Phase 2 before Phase 3: SEO and content pages should be in place before driving traffic. Polish is enhancement, not prerequisite.
- Analytics tracking infrastructure should deploy with Phase 1 even though the dashboard is Phase 3 -- historical data is lost without early tracking.

**Research flags for phases:**
- Phase 1: Verify Payload CMS `create-payload-app` setup and PostgreSQL adapter behavior with current version. Verify Instagram `ig.me/m/` deep link behavior across platforms.
- Phase 2: Standard Payload patterns. Low risk of needing additional research.
- Phase 3: Framer Motion integration with Next.js Server Components may need research (animation libraries require Client Components).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm registry. Payload CMS 3 + Next.js is well-documented |
| Features | MEDIUM-HIGH | Stable domain. Feature list derived from project requirements + jewelry brand web patterns |
| Architecture | HIGH | Payload embedded in Next.js is the documented, intended architecture for Payload 3 |
| Pitfalls | MEDIUM | Most pitfalls are well-established patterns. Instagram deep linking behavior should be re-verified at implementation time |

## Gaps to Address

- **Instagram deep link testing:** The `ig.me/m/{username}` URL behavior should be verified on actual devices before relying on it as the sole conversion path. Instagram changes URL schemes periodically.
- **Payload CMS 3 production deployment patterns:** While the development setup is well-documented, production deployment to Vercel with PostgreSQL and cloud image storage should be validated during Phase 1.
- **Vercel Blob vs S3 for image storage:** If deploying to Vercel, need to evaluate `@payloadcms/storage-vercel-blob` vs `@payloadcms/storage-s3` for cost and simplicity.
- **Framer Motion + Server Components:** Need to verify the integration pattern for animations that wrap Server Component content.
