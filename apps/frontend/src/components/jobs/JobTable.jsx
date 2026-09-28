import { Link } from 'react-router-dom'
import { ListChecks } from 'lucide-react'

import { JobRow } from '@/components/jobs/JobRow'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'

const COLUMNS = ['Job Name & ID', 'Status', 'Progress', 'Succeeded', 'Failed', 'Created', '']

export function JobTable({ jobs, isLoading, error, onRetryLoad, onCancel, onRetry, onExport, onDelete }) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-surface">
        <SkeletonTable rows={6} columns={6} />
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

  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface">
        <EmptyState
          icon={ListChecks}
          title="No jobs match this filter"
          description="Try a different status, or start a new ingestion job."
          action={
            <Button as={Link} to={ROUTES.NEW_UPLOAD} variant="primary" size="sm">
              New Upload
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
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
            {jobs.map((job) => (
              <JobRow
                key={job._id}
                job={job}
                onCancel={onCancel}
                onRetry={onRetry}
                onExport={onExport}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
