# Domain Pitfalls

**Domain:** Jewelry catalog / brand portfolio with Payload CMS
**Researched:** 2026-03-18
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Image Quality vs Performance Mismatch

**What goes wrong:** Either images are too compressed (jewelry looks dull, textures lost) or too large (pages take 5+ seconds to load on mobile from Instagram).
**Why it happens:** Default image optimization settings don't account for jewelry photography needs. Metallic textures, shine, and detail require higher quality than typical web images. Admin uploads straight from camera (5-15MB originals).
**Consequences:** Poor images = brand damage. Slow images = users bounce. Both destroy the purpose of the site.
**Prevention:**
- Configure Payload media collection with jewelry-specific image sizes: thumbnail (400px), card (800px), detail (1600px), zoom (2400px)
- Use WebP format with quality 80-85 (higher than typical 75 default)
- Generate blur placeholders (blurDataURL) for every image via Sharp
- Test with actual jewelry photos during development, not stock photos or placeholders
- Set max upload size with clear admin feedback
**Detection:** Lighthouse LCP > 2.5s on mobile = images need tuning. Test on throttled 3G.

### Pitfall 2: Instagram Deep Link Breakage

**What goes wrong:** The "Estou interessado" button that redirects to Instagram DMs breaks across platforms, opens the wrong thing (browser Instagram instead of app, generic profile instead of DM), or does nothing on certain devices.
**Why it happens:** Instagram deep linking is fragile. URL schemes differ between iOS, Android, desktop. Instagram frequently changes URL patterns.
**Consequences:** The ONLY conversion path is broken. Users who want to buy cannot contact the brand. No error feedback. Brand loses sales silently.
**Prevention:**
- Use `https://ig.me/m/{username}` as primary link (cross-platform, opens app if installed)
- Display the Instagram handle as visible text alongside the button (manual fallback)
- Make Instagram username configurable via Payload global settings (not hardcoded)
- Test on: iOS Safari, iOS Instagram in-app browser, Android Chrome, Android Instagram in-app browser, Desktop Chrome/Firefox
- Track button clicks for conversion analytics
**Detection:** No analytics on the button = flying blind. Only tested on one platform = will break on others.

### Pitfall 3: Building Schemas Before Planning the Data Model

**What goes wrong:** Start coding Payload collections immediately, change schemas multiple times, database migration headaches, frontend components don't match data shape.
**Why it happens:** Payload makes it easy to add collections, so developers start without planning. Excitement to see the admin panel.
**Consequences:** Broken relationships, wasted frontend work, painful schema migrations.
**Prevention:**
- Define ALL Payload collections (fields, relationships, access control) before writing code
- Map out: products -> categories (many-to-one), products <-> collections (many-to-many), pages -> menu position
- Get the brand owner to validate the field list before building
- Document the schema in ARCHITECTURE.md (already done)
**Detection:** If you're changing collection schemas after building frontend components, you started too early.

### Pitfall 4: Poor Mobile Layout for Jewelry Browsing

**What goes wrong:** Site looks great on desktop, mediocre on mobile. But 70-80% of traffic comes from Instagram links on phones.
**Why it happens:** Developers work on desktop monitors. Mobile is an afterthought. Jewelry detail needs careful mobile design (how big should thumbnails be? how does zoom work?).
**Consequences:** Majority of visitors have a poor experience. High bounce rate from the exact audience the site is built for.
**Prevention:**
- Design mobile-first with Tailwind. Desktop is the adaptation, not the other way around
- Product grid: 2 columns on mobile with thumbnails at minimum 44% viewport width
- Product detail: full-width images with swipe gesture support
- Test on actual phones, not just browser DevTools
- Instagram in-app browser has quirks -- test there specifically
- Touch targets 44x44px minimum for gallery navigation
**Detection:** Open the site on your phone via an Instagram Story link. If anything feels off, fix it.

## Moderate Pitfalls

### Pitfall 5: Forgetting Payload Revalidation on Content Changes

**What goes wrong:** Admin updates a product in the admin panel, but the public site still shows old content because pages are statically generated and cached.
**Why it happens:** ISR/static generation caches pages. Without explicit revalidation in Payload hooks, caches serve stale content indefinitely.
**Prevention:**
- Add `afterChange` hooks to EVERY content collection that calls `revalidatePath()` for affected routes
- Test the full flow: admin edits product -> public page reflects changes within seconds
- Use `revalidateTag` for collection-level cache invalidation where appropriate
**Detection:** Admin changes something, refreshes the public page, sees old content.

### Pitfall 6: Payload Access Control Left Open

**What goes wrong:** API endpoints are publicly writable. Anyone can POST to `/api/products` and create products, or DELETE content.
**Why it happens:** Payload default access can be permissive during development. Developer forgets to lock it down.
**Prevention:**
- Configure access control on EVERY collection from day one:
  - `read`: public (visitors can read products, categories, pages)
  - `create/update/delete`: admin only (`({ req }) => Boolean(req.user)`)
- Test by hitting `POST /api/products` without auth -- should return 401/403
**Detection:** Try API mutation endpoints from an unauthenticated browser. If they succeed, access control is missing.

### Pitfall 7: Image Storage Fails on Serverless Deployment

**What goes wrong:** Payload stores images to local disk by default. Works in dev, fails on Vercel because the filesystem is ephemeral -- uploaded images disappear after redeployment.
**Why it happens:** Local storage "just works" during development. Serverless filesystem resets on each deploy.
**Prevention:**
- Decide deployment target before Phase 1 ends
- If Vercel: use `@payloadcms/storage-vercel-blob` or `@payloadcms/storage-s3`
- If VPS (Hetzner/DigitalOcean): local disk storage is fine, persistent filesystem
- Configure storage adapter early, not as an afterthought
**Detection:** Images work in dev but disappear after deploying to Vercel.

### Pitfall 8: Portuguese Characters Breaking Slugs

**What goes wrong:** Accented characters (a, e, c, o, u) create invalid or ugly URL slugs, or cause database lookup failures.
**Why it happens:** Default slug generation may not strip diacritics. "Colecao Verao" becomes "colecao-verao" or breaks entirely.
**Prevention:**
- Configure Payload slug fields with a `beforeValidate` hook that strips diacritics and normalizes to URL-safe ASCII
- Ensure PostgreSQL database uses UTF-8 encoding
- Set `<html lang="pt">` and proper charset meta tags
- Test with real Portuguese product names during development
**Detection:** Slugs containing accented characters or broken URLs.

### Pitfall 9: Category/Collection Structure Too Rigid

**What goes wrong:** Data model forces a product into exactly one category with no collections, or makes collections just renamed categories. Admin cannot put a ring in both "Aneis" category and "Colecao Verao 2026" collection.
**Why it happens:** Developer models a single `category_id` foreign key without understanding that jewelry has two axes: product type (category) and thematic grouping (collection).
**Prevention:**
- Separate concepts: Category = product type (required, one per product), Collection = thematic group (optional, many per product)
- Products have one category (many-to-one) and zero or more collections (many-to-many)
- Both are independently browsable on the frontend
**Detection:** Admin asks "how do I put this ring in the summer collection AND the rings page?"

### Pitfall 10: Rich Text Editor Producing Inconsistent Styling

**What goes wrong:** Admin creates dynamic pages with styling that clashes with the site's minimalist design. Bold colored text in the about page destroys the luxury aesthetic.
**Why it happens:** Rich text editors can allow arbitrary styling if not restricted.
**Prevention:**
- Payload's Lexical editor is already more structured than traditional WYSIWYG
- Restrict allowed features: headings (H2, H3), paragraphs, bold, italic, links, images, lists
- Disable inline color/font controls -- content inherits site typography
- Use a consistent rich text renderer on the frontend that applies site styles
**Detection:** Admin-created pages look visually different from the rest of the site.

## Minor Pitfalls

### Pitfall 11: Instagram In-App Browser Quirks

**What goes wrong:** CSS features or JavaScript APIs behave differently in Instagram's WebView (in-app browser).
**Prevention:** Test by sharing a link in an Instagram DM and opening it there. Avoid `position: fixed` for critical UI. Test gallery touch gestures in the WebView.

### Pitfall 12: Missing OG Images and Favicon

**What goes wrong:** Shared product links on WhatsApp/Instagram show no preview image or broken thumbnail.
**Prevention:** Configure Payload SEO plugin on product and page collections. Set OG image to product cover image. Set up favicon and Apple touch icons early. Test with Meta's Sharing Debugger.

### Pitfall 13: Payload Admin Left With Default Branding

**What goes wrong:** Admin panel shows "Payload" branding. Admin user sees unfamiliar branding, feels disconnected from their brand.
**Prevention:** Customize Payload admin config: logo, favicon, title, dashboard description. Small effort, big professional feel. Do this in Phase 1.

### Pitfall 14: No Image Zoom on Product Detail

**What goes wrong:** Product images display at fixed size with no zoom. For jewelry, users need to see texture, stone settings, finish quality.
**Prevention:** Implement lightbox/fullscreen gallery with pinch-to-zoom (mobile) and hover/click-to-zoom (desktop). Ensure uploaded images have enough resolution for zoom (2400px on longest edge).
**Detection:** Brand owner receives DMs asking for "more photos" of products already in the catalog.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data model (collections) | Schema changes after building UI (#3), rigid category structure (#9) | Plan all collections before coding. Separate categories from collections |
| Image upload setup | Wrong sizes/quality for jewelry (#1), storage strategy (#7) | Configure Sharp with jewelry-specific sizes. Decide hosting early |
| Public catalog frontend | Desktop-first design (#4), no zoom (#14) | Mobile-first with Tailwind. Test on real phones via Instagram |
| Instagram CTA | Deep link breakage (#2) | Cross-platform testing, visible handle fallback, click tracking |
| Content management | Inconsistent rich text styling (#10) | Restrict Lexical editor features |
| Cache/deployment | Stale content after admin edits (#5) | Revalidation hooks on every content collection |
| API security | Open write endpoints (#6) | Access control on every collection from day one |
| SEO/sharing | No link previews (#12) | Payload SEO plugin from Phase 1 |
| Admin UX | Default Payload branding (#13) | Customize admin config early |
| Portuguese content | Broken slugs (#8) | Diacritics-stripping slug hook |

## Sources

- Payload CMS architecture patterns and access control model
- Next.js ISR revalidation patterns (well-documented caching behavior)
- Instagram deep linking behavior (fragile, frequently changing -- verify before implementation)
- Image optimization best practices applied to jewelry photography context
- Portuguese language web development considerations
