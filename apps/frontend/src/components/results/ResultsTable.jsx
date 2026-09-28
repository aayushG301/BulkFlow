import { Table2 } from 'lucide-react'

import { ResultRow } from '@/components/results/ResultRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { SkeletonTable } from '@/components/ui/Skeleton'

const COLUMNS = ['Row #', 'Status', 'Original Input', 'Processed Data', '']

export function ResultsTable({ results, isLoading, error, onRetryLoad }) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface">
        <SkeletonTable rows={8} columns={5} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-surface">
        <ErrorState description={error} onRetry={onRetryLoad} />
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface">
        <EmptyState
          icon={Table2}
          title="No results match this filter"
          description="Try a different status filter or search term."
        />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              {COLUMNS.map((column) => (
                <th key={column} className="px-5 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <ResultRow key={result._id} result={result} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
