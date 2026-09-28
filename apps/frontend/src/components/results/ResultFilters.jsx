import { Search } from 'lucide-react'

import { Input } from '@/components/ui/Input'
import { RESULT_STATUS_FILTERS } from '@/constants/result.constants'
import clsx from 'clsx'

export function ResultFilters({ activeStatus, onStatusChange, search, onSearchChange }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1 rounded-md border border-border bg-surface p-1">
        {RESULT_STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value || 'all'}
            type="button"
            onClick={() => onStatusChange(filter.value)}
            className={clsx(
              'rounded px-2.5 py-1 text-xs font-medium transition-colors',
              activeStatus === filter.value
                ? 'bg-accent-soft text-accent'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <Input
        icon={Search}
        placeholder="Search within row values…"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        containerClassName="min-w-[220px] flex-1"
      />
    </div>
  )
}
