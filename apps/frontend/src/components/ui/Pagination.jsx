import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

// Builds a compact page list like: 1  2  3  …  22
const buildPageList = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, total, current, current - 1, current + 1])
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)

  const withEllipsis = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      withEllipsis.push('ellipsis-' + page)
    }
    withEllipsis.push(page)
  })

  return withEllipsis
}

export function Pagination({ page, totalPages, onPageChange, className }) {
  if (!totalPages || totalPages <= 1) return null

  const pages = buildPageList(page, totalPages)

  return (
    <nav className={clsx('flex items-center gap-1', className)} aria-label="Pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs text-ink-muted transition-colors hover:enabled:bg-surface-hover hover:enabled:text-ink disabled:opacity-40"
      >
        <ChevronLeft className="size-3.5" />
        Previous
      </button>

      <div className="mx-1 flex items-center gap-1">
        {pages.map((entry) =>
          typeof entry === 'number' ? (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-current={entry === page ? 'page' : undefined}
              className={clsx(
                'flex h-8 min-w-8 items-center justify-center rounded-md px-2 font-mono text-xs transition-colors',
                entry === page
                  ? 'bg-accent-soft text-accent font-semibold'
                  : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
              )}
            >
              {entry}
            </button>
          ) : (
            <span key={entry} className="px-1 text-xs text-ink-faint">
              …
            </span>
          ),
        )}
      </div>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-xs text-ink-muted transition-colors hover:enabled:bg-surface-hover hover:enabled:text-ink disabled:opacity-40"
      >
        Next
        <ChevronRight className="size-3.5" />
      </button>
    </nav>
  )
}
