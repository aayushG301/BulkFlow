import { ProgressBar } from '@/components/ui/ProgressBar'
import { JOB_STATUS_META } from '@/constants/job.constants'
import { formatNumber } from '@/utils/formatNumber'

export function JobProgress({ job, showRows = true, className }) {
  const meta = JOB_STATUS_META[job.status] || JOB_STATUS_META.queued
  const { processedRows = 0, totalRows = 0 } = job.processStats || {}

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <ProgressBar value={job.progress} tone={meta.tone} className="w-28" />
        <span className="font-mono text-xs tabular-nums text-ink-muted">{job.progress || 0}%</span>
      </div>
      {showRows && (
        <p className="mt-1 font-mono text-[11px] tabular-nums text-ink-faint">
          {formatNumber(processedRows)} / {formatNumber(totalRows)} rows
        </p>
      )}
    </div>
  )
}
