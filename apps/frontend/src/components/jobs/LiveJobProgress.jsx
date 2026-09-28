import { Wifi, WifiOff } from 'lucide-react'
import clsx from 'clsx'

import { JobStatusBadge } from '@/components/jobs/JobStatusBadge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { JOB_STATUS_META } from '@/constants/job.constants'
import { formatNumber } from '@/utils/formatNumber'

export function LiveJobProgress({ job, isLive }) {
  const meta = JOB_STATUS_META[job.status] || JOB_STATUS_META.queued
  const { processedRows = 0, totalRows = 0 } = job.processStats || {}
  const remainingRows = Math.max(0, totalRows - processedRows)

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <JobStatusBadge status={job.status} />
          <span
            className={clsx(
              'flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide',
              isLive ? 'text-status-completed' : 'text-ink-faint',
            )}
          >
            {isLive ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
            {isLive ? 'Live updates' : 'Not connected'}
          </span>
        </div>
        <span className="font-mono text-2xl font-semibold tabular-nums text-ink">
          {job.progress || 0}%
        </span>
      </div>

      <ProgressBar value={job.progress} tone={meta.tone} size="md" className="mt-4" />

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="Total" value={formatNumber(totalRows)} />
        <MiniStat label="Processed" value={formatNumber(processedRows)} />
        <MiniStat label="Remaining" value={formatNumber(remainingRows)} />
        <MiniStat label="Failed" value={formatNumber(job.processStats?.failedRows)} tone="text-status-failed" />
      </div>
    </div>
  )
}

function MiniStat({ label, value, tone = 'text-ink' }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${tone}`}>{value}</span>
    </div>
  )
}
