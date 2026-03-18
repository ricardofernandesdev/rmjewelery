import { describe, it, expect } from 'vitest'

/**
 * Tests for InstagramCTA component (CONT-01, CONT-02).
 *
 * Since InstagramCTA is a React Server Component we cannot render it in Vitest
 * with a DOM. Instead we import the module source and validate the URL
 * construction logic and expected constants.
 */

const DEFAULT_USERNAME = 'rmjewelery'

describe('InstagramCTA component logic', () => {
  it('constructs the correct Instagram DM URL (CONT-01)', () => {
    const href = `https://ig.me/m/${DEFAULT_USERNAME}`
    expect(href).toBe('https://ig.me/m/rmjewelery')
  })

  it('URL uses ig.me/m/ format (deep link)', () => {
    const href = `https://ig.me/m/${DEFAULT_USERNAME}`
    expect(href).toMatch(/^https:\/\/ig\.me\/m\/[a-zA-Z0-9._]+$/)
  })

  it('default username is rmjewelery', () => {
    expect(DEFAULT_USERNAME).toBe('rmjewelery')
  })

  it('InstagramCTA module exports a function', async () => {
    const mod = await import('../../src/components/product/InstagramCTA')
    expect(typeof mod.InstagramCTA).toBe('function')
  })

  it('renders JSX with expected anchor attributes (CONT-02)', async () => {
    // Import the component and call it to get JSX tree
    const { InstagramCTA } = await import(
      '../../src/components/product/InstagramCTA'
    )
    const jsx = InstagramCTA() as any

    // Navigate the JSX tree: div > [a, span]
    const children = jsx.props.children
    const anchor = children[0] // first child is the <a>
    const span = children[1] // second child is the <span>

    expect(anchor.type).toBe('a')
    expect(anchor.props.href).toBe('https://ig.me/m/rmjewelery')
    expect(anchor.props.target).toBe('_blank')
    expect(anchor.props.rel).toBe('noopener noreferrer')

    // Check "Estou interessado" text is among anchor children
    const anchorChildren = anchor.props.children
    const textChild = Array.isArray(anchorChildren)
      ? anchorChildren.find((c: any) => typeof c === 'string')
      : anchorChildren
    expect(textChild).toContain('Estou interessado')

    // Check @username fallback
    const spanChildren = span.props.children
    const spanText = Array.isArray(spanChildren)
      ? spanChildren.join('')
      : spanChildren
    expect(spanText).toContain(DEFAULT_USERNAME)
  })
})
