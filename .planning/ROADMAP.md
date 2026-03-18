# Roadmap: RM Jewelry — Catalogo Digital

## Overview

Transform RM Jewelry's Instagram-first brand into a polished digital portfolio. Starting from Payload CMS foundation, build outward through product catalog browsing, homepage brand experience, dynamic content pages, SEO optimization, and finally polish with animations and analytics. Each phase delivers a verifiable capability that builds toward the core value: visitors browse jewelry visually, feel the brand identity, and contact via Instagram.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Data Model** - Payload CMS setup with product/category schemas, admin auth, image pipeline, and API
- [ ] **Phase 2: Product Catalog** - Public product browsing by category with detail pages, Instagram CTA, and mobile-first layout
- [ ] **Phase 3: Collections & Homepage** - Thematic collections, hero banners, featured products, and homepage composition
- [ ] **Phase 4: Dynamic Pages & Navigation** - Admin-created rich text pages with configurable menu placement
- [ ] **Phase 5: SEO & Social Sharing** - Meta tags, OG images, sitemap, structured data for search visibility
- [ ] **Phase 6: Polish & Analytics** - Image zoom, transitions, blur-up loading, view tracking, and analytics dashboard

## Phase Details

### Phase 1: Foundation & Data Model
**Goal**: Admin can manage products, categories, and images through Payload CMS with processed image output
**Depends on**: Nothing (first phase)
**Requirements**: ADM-01, ADM-02, ADM-05, ADM-06, INF-01, INF-02, INF-03
**Success Criteria** (what must be TRUE):
  1. Admin can log in to /admin and access the dashboard
  2. Admin can create a product with name, description, category, and multiple uploaded photos
  3. Admin can reorder photos on a product and see the new order reflected
  4. Admin can create, edit, and delete categories
  5. Uploaded images are automatically resized to multiple sizes with WebP conversion and blur placeholders generated
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Scaffold Payload CMS project with Media collection and image processing pipeline
- [ ] 01-02-PLAN.md — Create Categories and Products collections with access control and admin seed
- [ ] 01-03-PLAN.md — Integration test suite and human verification of admin workflow

### Phase 2: Product Catalog
**Goal**: Visitors can browse the full jewelry collection on any device and express interest via Instagram
**Depends on**: Phase 1
**Requirements**: CAT-01, CAT-02, CAT-03, CONT-01, CONT-02, HOME-03, HOME-04
**Success Criteria** (what must be TRUE):
  1. Visitor sees products in a photo-forward grid layout on the catalog page
  2. Visitor can tap a category to see only products in that category
  3. Visitor can open a product detail page showing name, description, and multiple photo angles
  4. Visitor can tap "Estou interessado" button on any product and be redirected to Instagram DMs (working on iOS, Android, desktop)
  5. Site is fully responsive with clean navigation containing max 5-6 top-level items
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Collections & Homepage
**Goal**: Homepage showcases the brand identity with banners, featured products, and thematic collections
**Depends on**: Phase 2
**Requirements**: CAT-04, HOME-01, HOME-02, ADM-03, ADM-04, ADM-07, ADM-08
**Success Criteria** (what must be TRUE):
  1. Visitor sees hero banners on the homepage showcasing brand or collections
  2. Visitor sees featured/highlighted products on the homepage
  3. Visitor can browse products by thematic collection (e.g., "Verao 2026")
  4. Admin can create collections, assign products to them, and manage homepage banners
  5. Admin can mark products as featured and they appear on the homepage
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Dynamic Pages & Navigation
**Goal**: Admin can create and publish informational pages positioned in site menus without any code changes
**Depends on**: Phase 2
**Requirements**: PAGE-01, PAGE-02, PAGE-03, ADM-09, ADM-10, ADM-11
**Success Criteria** (what must be TRUE):
  1. Admin can create a new page with rich text content (formatting, images) using Lexical editor
  2. Admin can choose whether a page appears in header menu, footer menu, or both
  3. Admin can reorder pages within menus and the public site reflects the new order
  4. Visitor can navigate to dynamic pages (e.g., guia de limpeza, about us) from header or footer
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: SEO & Social Sharing
**Goal**: Site is discoverable via search engines and product links show rich previews when shared
**Depends on**: Phase 3, Phase 4
**Requirements**: SEO-01, SEO-02, SEO-03, CAT-07
**Success Criteria** (what must be TRUE):
  1. Every public page has proper meta title, description, and OG tags
  2. Sharing a product link on WhatsApp/Instagram shows a rich preview with product image and name
  3. XML sitemap is automatically generated and includes all public pages and products
  4. Product pages include structured data (JSON-LD) for rich search results
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Polish & Analytics
**Goal**: The browsing experience feels premium with smooth interactions, and admin has visibility into what visitors view
**Depends on**: Phase 5
**Requirements**: CAT-05, CAT-06, HOME-05, HOME-06, ADM-12, ADM-13, ADM-14
**Success Criteria** (what must be TRUE):
  1. Visitor can zoom into product images (pinch-to-zoom on mobile, hover-zoom on desktop)
  2. Visitor sees a "Novidades" section with recently added products
  3. Images load with blur-up placeholder effect instead of blank spaces
  4. Pages have smooth transitions and subtle micro-animations (Framer Motion)
  5. Admin can see a dashboard with total page views, most viewed products, and most viewed categories
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD
- [ ] 06-03: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Data Model | 0/3 | Planning complete | - |
| 2. Product Catalog | 0/3 | Not started | - |
| 3. Collections & Homepage | 0/3 | Not started | - |
| 4. Dynamic Pages & Navigation | 0/2 | Not started | - |
| 5. SEO & Social Sharing | 0/2 | Not started | - |
| 6. Polish & Analytics | 0/3 | Not started | - |
