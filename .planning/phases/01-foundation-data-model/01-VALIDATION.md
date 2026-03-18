---
phase: 1
slug: foundation-data-model
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | ADM-01 | integration | `npx vitest run tests/collections/products.test.ts -t "create product"` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | ADM-02 | integration | `npx vitest run tests/collections/products.test.ts -t "upload images"` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | ADM-05 | integration | `npx vitest run tests/collections/products.test.ts -t "reorder images"` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | ADM-06 | integration | `npx vitest run tests/collections/categories.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | INF-01 | integration | `npx vitest run tests/collections/media.test.ts -t "image sizes"` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | INF-02 | integration | `npx vitest run tests/access-control.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | INF-03 | integration | `npx vitest run tests/api.test.ts -t "public read"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration with Payload test setup
- [ ] `tests/helpers/payload.ts` — Shared test helper to initialize Payload with test database
- [ ] `tests/collections/products.test.ts` — Products CRUD + image upload tests
- [ ] `tests/collections/categories.test.ts` — Categories CRUD tests
- [ ] `tests/collections/media.test.ts` — Image processing tests
- [ ] `tests/access-control.test.ts` — Access control verification
- [ ] `tests/api.test.ts` — Public REST API tests
- [ ] Framework install: `npm install -D vitest` — if none detected

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin can log in to /admin | INF-02 | Browser-based auth flow | Navigate to /admin, enter credentials, verify dashboard loads |
| Drag-and-drop image reorder in admin | ADM-05 | UI interaction testing | Open product in admin, drag images to reorder, save, verify order persists |
| Image quality assessment | INF-01 | Visual quality subjective | Upload jewelry photo, compare original vs processed WebP at multiple sizes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
