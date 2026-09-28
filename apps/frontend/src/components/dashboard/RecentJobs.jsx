import { Link } from 'react-router-dom'
import { Inbox } from 'lucide-react'

import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { JOB_STATUS_META } from '@/constants/job.constants'
import { jobDetailsPath, ROUTES } from '@/constants/routes'
import { formatNumber } from '@/utils/formatNumber'
import { formatRelativeTime } from '@/utils/formatDate'
import { Button } from '@/components/ui/Button'

export function RecentJobs({ jobs = [] }) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-ink">Recent Jobs</h3>
        <Link to={ROUTES.JOBS} className="text-xs font-medium text-accent hover:underline">
          View all
        </Link>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No jobs yet"
          description="Upload a CSV or XLSX file to start your first ingestion job."
          action={
            <Button as={Link} to={ROUTES.NEW_UPLOAD} variant="primary" size="sm">
              New Upload
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-2.5 font-medium">Job Name</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Progress</th>
                <th className="px-5 py-2.5 font-medium">Rows</th>
                <th className="px-5 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const meta = JOB_STATUS_META[job.status] || JOB_STATUS_META.queued
                return (
                  <tr
                    key={job._id}
                    className="border-b border-border last:border-0 hover:bg-surface-hover"
                  >
                    <td className="px-5 py-3">
                      <Link to={jobDetailsPath(job._id)} className="font-medium text-ink hover:text-accent">
                        {job.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={meta.tone} dot live={meta.live}>
                        {meta.label}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={job.progress} tone={meta.tone} className="w-24" />
                        <span className="font-mono text-xs text-ink-muted tabular-nums">
                          {job.progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-ink-muted tabular-nums">
                      {formatNumber(job.processStats?.processedRows)} /{' '}
                      {formatNumber(job.processStats?.totalRows)}
                    </td>
                    <td className="px-5 py-3 text-xs text-ink-muted">
                      {formatRelativeTime(job.createdAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
