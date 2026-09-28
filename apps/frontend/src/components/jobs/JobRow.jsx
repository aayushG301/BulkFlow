import { Link, useNavigate } from 'react-router-dom'

import { JobStatusBadge } from '@/components/jobs/JobStatusBadge'
import { JobProgress } from '@/components/jobs/JobProgress'
import { JobActions } from '@/components/jobs/JobActions'
import { jobDetailsPath } from '@/constants/routes'
import { formatNumber } from '@/utils/formatNumber'
import { formatRelativeTime } from '@/utils/formatDate'

export function JobRow({ job, onCancel, onRetry, onExport, onDelete }) {
  const navigate = useNavigate()
  const { successfulRows = 0, failedRows = 0 } = job.processStats || {}

  return (
    <tr className="border-b border-border last:border-0 hover:bg-surface-hover">
      <td className="px-5 py-3.5">
        <Link to={jobDetailsPath(job._id)} className="font-medium text-ink hover:text-accent">
          {job.name}
        </Link>
        <p className="font-mono text-[11px] text-ink-faint">JOB-{job._id.slice(-6).toUpperCase()}</p>
      </td>
      <td className="px-5 py-3.5">
        <JobStatusBadge status={job.status} />
      </td>
      <td className="px-5 py-3.5">
        <JobProgress job={job} />
      </td>
      <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-status-completed">
        {formatNumber(successfulRows)}
      </td>
      <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-status-failed">
        {formatNumber(failedRows)}
      </td>
      <td className="px-5 py-3.5 text-xs text-ink-muted">{formatRelativeTime(job.createdAt)}</td>
      <td className="px-5 py-3.5 text-right">
        <JobActions
          job={job}
          onView={() => navigate(jobDetailsPath(job._id))}
          onCancel={onCancel}
          onRetry={onRetry}
          onExport={onExport}
          onDelete={onDelete}
        />
      </td>
    </tr>
  )
}
