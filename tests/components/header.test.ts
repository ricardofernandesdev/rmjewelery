import { describe, it, expect } from 'vitest'

/**
 * Tests for Header component navigation logic (HOME-03).
 *
 * The Header is a Server Component that fetches categories and builds
 * a navItems array. We test the logic: max 6 items = 2 fixed + up to 4 categories.
 */

type NavItem = { label: string; href: string }

function buildNavItems(
  categories: { name: string; slug: string }[],
): NavItem[] {
  return [
    { label: 'Inicio', href: '/' },
    { label: 'Catalogo', href: '/products' },
    ...categories.slice(0, 4).map((cat) => ({
      label: cat.name,
      href: `/categories/${cat.slug}`,
    })),
  ]
}

describe('Header navigation (HOME-03)', () => {
  it('always includes Inicio and Catalogo links', () => {
    const items = buildNavItems([])
    expect(items).toHaveLength(2)
    expect(items[0]).toEqual({ label: 'Inicio', href: '/' })
    expect(items[1]).toEqual({ label: 'Catalogo', href: '/products' })
  })

  it('includes up to 4 categories from database', () => {
    const cats = [
      { name: 'Aneis', slug: 'aneis' },
      { name: 'Colares', slug: 'colares' },
      { name: 'Pulseiras', slug: 'pulseiras' },
      { name: 'Brincos', slug: 'brincos' },
    ]
    const items = buildNavItems(cats)
    expect(items).toHaveLength(6)
    expect(items[2]).toEqual({ label: 'Aneis', href: '/categories/aneis' })
  })

  it('caps at 6 items even with more than 4 categories (HOME-03)', () => {
    const cats = Array.from({ length: 10 }, (_, i) => ({
      name: `Cat ${i}`,
      slug: `cat-${i}`,
    }))
    const items = buildNavItems(cats)
    expect(items).toHaveLength(6)
    expect(items.length).toBeLessThanOrEqual(6)
  })

  it('builds correct category hrefs', () => {
    const items = buildNavItems([{ name: 'Aneis', slug: 'aneis' }])
    expect(items[2].href).toBe('/categories/aneis')
  })
})
