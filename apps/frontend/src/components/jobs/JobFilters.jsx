import clsx from 'clsx'

import { JOB_STATUS_FILTERS } from '@/constants/job.constants'

export function JobFilters({ activeStatus, onChange, counts = {} }) {
  return (
    <div className="flex flex-wrap gap-2">
      {JOB_STATUS_FILTERS.map((filter) => {
        const isActive = activeStatus === filter.value
        const count = counts[filter.value]

        return (
          <button
            key={filter.value || 'all'}
            type="button"
            onClick={() => onChange(filter.value)}
            className={clsx(
              'flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'border-accent/40 bg-accent-soft text-accent'
                : 'border-border bg-surface text-ink-muted hover:text-ink',
            )}
          >
            {filter.label}
            {count !== undefined && (
              <span
                className={clsx(
                  'rounded-full px-1.5 py-0.5 font-mono text-[11px] tabular-nums',
                  isActive ? 'bg-accent/20 text-accent' : 'bg-surface-active text-ink-faint',
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
