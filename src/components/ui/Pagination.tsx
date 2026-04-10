import Link from 'next/link'

type Props = {
  currentPage: number
  totalPages: number
  /** Build href for a given page number */
  buildHref: (page: number) => string
}

/**
 * Build a compact list of page numbers with ellipsis.
 * Example: currentPage=5, totalPages=10 → [1, '...', 4, 5, 6, '...', 10]
 */
function buildPageList(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  if (start > 2) pages.push('ellipsis')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < totalPages - 1) pages.push('ellipsis')

  pages.push(totalPages)
  return pages
}

export function Pagination({ currentPage, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null

  const pages = buildPageList(currentPage, totalPages)
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  const baseBtn =
    'inline-flex items-center justify-center min-w-[36px] h-9 px-3 text-sm border transition-colors'
  const idle = 'border-brand-dark/20 text-brand-dark hover:bg-brand-dark hover:text-white'
  const active = 'border-brand-dark bg-brand-dark text-white'
  const disabled = 'border-brand-dark/10 text-brand-dark/30 pointer-events-none'

  return (
    <nav
      aria-label="Paginação"
      className="mt-10 flex items-center justify-center gap-2 flex-wrap"
    >
      <Link
        href={hasPrev ? buildHref(currentPage - 1) : '#'}
        aria-label="Página anterior"
        aria-disabled={!hasPrev}
        className={`${baseBtn} ${hasPrev ? idle : disabled}`}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
        </svg>
      </Link>

      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span
            key={`ellipsis-${idx}`}
            className="inline-flex items-center justify-center min-w-[36px] h-9 text-sm text-brand-dark/50"
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            aria-current={p === currentPage ? 'page' : undefined}
            className={`${baseBtn} ${p === currentPage ? active : idle}`}
          >
            {p}
          </Link>
        ),
      )}

      <Link
        href={hasNext ? buildHref(currentPage + 1) : '#'}
        aria-label="Página seguinte"
        aria-disabled={!hasNext}
        className={`${baseBtn} ${hasNext ? idle : disabled}`}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
        </svg>
      </Link>
    </nav>
  )
}
