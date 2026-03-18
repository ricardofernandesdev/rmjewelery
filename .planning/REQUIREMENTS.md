# Requirements: RM Jewelry — Catálogo Digital

**Defined:** 2026-03-18
**Core Value:** O cliente consegue navegar pela coleção de joias de forma visual e apelativa, sentindo a identidade da marca, e contactar facilmente via Instagram.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Catalog

- [x] **CAT-01**: User can browse products in a photo-forward grid layout
- [x] **CAT-02**: User can view product detail page with name, description, and multiple photo angles
- [x] **CAT-03**: User can browse products by category (Anéis, Colares, Pulseiras, Brincos, etc.)
- [ ] **CAT-04**: User can browse products by thematic collection (e.g., "Verão 2026")
- [ ] **CAT-05**: User can zoom into product images (pinch-to-zoom on mobile, hover-zoom on desktop)
- [ ] **CAT-06**: User can see a "Novidades" section with recently added products
- [ ] **CAT-07**: User can share a product link that shows rich preview (OG tags) on social/messaging apps

### Contact

- [x] **CONT-01**: User can tap "Estou interessado" button with Instagram icon on any product to open Instagram DMs
- [x] **CONT-02**: Instagram DM redirect works on iOS, Android, and desktop browsers

### Homepage & Branding

- [ ] **HOME-01**: User sees hero banners on homepage showcasing brand/collections
- [ ] **HOME-02**: User sees featured/highlighted products on homepage
- [x] **HOME-03**: User experiences clean, minimal navigation with max 5-6 top-level items
- [x] **HOME-04**: Site is fully responsive and mobile-first (optimized for Instagram traffic)
- [ ] **HOME-05**: Images load with blur-up placeholder effect (not blank spaces)
- [ ] **HOME-06**: Pages have smooth transitions and subtle micro-animations

### Dynamic Pages

- [ ] **PAGE-01**: User can access informational pages (guia de limpeza, guia de tamanhos, about us)
- [ ] **PAGE-02**: Dynamic pages appear in header menu, footer menu, or both (admin-configured)
- [ ] **PAGE-03**: Dynamic pages support rich text content with formatting and images

### SEO

- [ ] **SEO-01**: All public pages have proper meta tags (title, description, OG tags)
- [ ] **SEO-02**: Site generates XML sitemap automatically
- [ ] **SEO-03**: Product pages use structured data for rich search results

### Admin — Products

- [x] **ADM-01**: Admin can create, edit, and delete products with name, description, and category
- [x] **ADM-02**: Admin can upload multiple photos per product with drag-and-drop
- [ ] **ADM-03**: Admin can assign products to one or more collections
- [ ] **ADM-04**: Admin can mark products as featured for homepage display
- [x] **ADM-05**: Admin can reorder product photos

### Admin — Organization

- [x] **ADM-06**: Admin can create, edit, and delete categories
- [ ] **ADM-07**: Admin can create, edit, and delete thematic collections
- [ ] **ADM-08**: Admin can create, edit, and delete homepage banners with images and links

### Admin — Content

- [ ] **ADM-09**: Admin can create dynamic pages with rich text editor (Lexical)
- [ ] **ADM-10**: Admin can choose page placement in navigation (header, footer, or both)
- [ ] **ADM-11**: Admin can reorder pages within menus

### Admin — Analytics

- [ ] **ADM-12**: Admin can see dashboard with total page views
- [ ] **ADM-13**: Admin can see most viewed products
- [ ] **ADM-14**: Admin can see most viewed categories

### Infrastructure

- [x] **INF-01**: Images are automatically processed on upload (resize, WebP, multiple sizes, blur placeholder)
- [x] **INF-02**: Admin panel is protected by authentication (single admin user)
- [x] **INF-03**: API serves all data for public frontend consumption

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhancements

- **V2-01**: Multi-language support (PT/EN)
- **V2-02**: Advanced product search/filtering
- **V2-03**: Product comparison feature
- **V2-04**: Email newsletter integration

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Shopping cart / checkout | Not e-commerce — brand portfolio with Instagram DM sales |
| Payment processing | No transactions on site |
| Price display | Brand decision — prices given via Instagram DM |
| User accounts / registration | Anonymous browsing only, no value in accounts |
| Product reviews / ratings | No purchases on-site, reviews meaningless |
| Wishlist / favorites | No user accounts to persist them |
| Live chat / chatbot | Single admin, Instagram DM is the channel |
| Blog engine | Dynamic pages cover informational content |
| Inventory / stock management | Not a store — admin removes unavailable pieces |
| Separate backend server | Payload CMS embeds in Next.js — single app |
| Custom admin panel | Payload provides admin UI out of the box |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAT-01 | Phase 2 | Complete |
| CAT-02 | Phase 2 | Complete |
| CAT-03 | Phase 2 | Complete |
| CAT-04 | Phase 3 | Pending |
| CAT-05 | Phase 6 | Pending |
| CAT-06 | Phase 6 | Pending |
| CAT-07 | Phase 5 | Pending |
| CONT-01 | Phase 2 | Complete |
| CONT-02 | Phase 2 | Complete |
| HOME-01 | Phase 3 | Pending |
| HOME-02 | Phase 3 | Pending |
| HOME-03 | Phase 2 | Complete |
| HOME-04 | Phase 2 | Complete |
| HOME-05 | Phase 6 | Pending |
| HOME-06 | Phase 6 | Pending |
| PAGE-01 | Phase 4 | Pending |
| PAGE-02 | Phase 4 | Pending |
| PAGE-03 | Phase 4 | Pending |
| SEO-01 | Phase 5 | Pending |
| SEO-02 | Phase 5 | Pending |
| SEO-03 | Phase 5 | Pending |
| ADM-01 | Phase 1 | Complete |
| ADM-02 | Phase 1 | Complete |
| ADM-03 | Phase 3 | Pending |
| ADM-04 | Phase 3 | Pending |
| ADM-05 | Phase 1 | Complete |
| ADM-06 | Phase 1 | Complete |
| ADM-07 | Phase 3 | Pending |
| ADM-08 | Phase 3 | Pending |
| ADM-09 | Phase 4 | Pending |
| ADM-10 | Phase 4 | Pending |
| ADM-11 | Phase 4 | Pending |
| ADM-12 | Phase 6 | Pending |
| ADM-13 | Phase 6 | Pending |
| ADM-14 | Phase 6 | Pending |
| INF-01 | Phase 1 | Complete |
| INF-02 | Phase 1 | Complete |
| INF-03 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after roadmap creation*
