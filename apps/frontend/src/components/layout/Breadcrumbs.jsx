import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function Breadcrumbs({ items = [] }) {
  return (
    <nav className="flex min-w-0 items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      <span className="font-mono text-ink-faint">BulkFlow</span>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={item.label} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="size-3.5 shrink-0 text-ink-faint" />
            {item.to && !isLast ? (
              <Link to={item.to} className="truncate text-ink-muted hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'truncate font-semibold text-ink' : 'truncate text-ink-muted'}>
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
