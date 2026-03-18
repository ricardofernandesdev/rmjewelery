---
phase: 2
slug: product-catalog
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1 |
| **Config file** | `vitest.config.ts` (exists from Phase 1) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | CAT-01 | integration | `npx vitest run tests/pages/catalog.test.ts -t "renders product grid"` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | CAT-02 | integration | `npx vitest run tests/pages/product-detail.test.ts -t "renders product detail"` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | CAT-03 | integration | `npx vitest run tests/pages/category.test.ts -t "filters by category"` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | CONT-01 | unit | `npx vitest run tests/components/instagram-cta.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | CONT-02 | unit | `npx vitest run tests/components/instagram-cta.test.ts -t "ig.me format"` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | HOME-03 | unit | `npx vitest run tests/components/header.test.ts -t "nav items"` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 3 | HOME-04 | manual | Visual inspection on mobile/tablet/desktop | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/pages/catalog.test.ts` — Product grid rendering (CAT-01)
- [ ] `tests/pages/product-detail.test.ts` — Product detail page (CAT-02)
- [ ] `tests/pages/category.test.ts` — Category filtering (CAT-03)
- [ ] `tests/components/instagram-cta.test.ts` — Instagram CTA button (CONT-01, CONT-02)
- [ ] `tests/components/header.test.ts` — Navigation rendering (HOME-03)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Responsive design on mobile/tablet/desktop | HOME-04 | CSS visual inspection | Open site on mobile, tablet, desktop — verify layout adapts correctly |
| Instagram DM redirect works on real devices | CONT-02 | Device-specific deep link behavior | Tap "Estou interessado" on iOS, Android, desktop — verify Instagram opens |
| Photo-forward grid visual quality | CAT-01 | Aesthetic judgment | Verify images are crisp, grid layout is visually appealing |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
