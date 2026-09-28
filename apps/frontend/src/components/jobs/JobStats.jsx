import { formatNumber } from '@/utils/formatNumber'

function Stat({ label, value, tone = 'text-ink' }) {
  return (
    <div className="flex flex-1 flex-col gap-1 rounded-lg border border-border bg-surface px-4 py-3">
      <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">{label}</span>
      <span className={`text-xl font-semibold tabular-nums ${tone}`}>{value}</span>
    </div>
  )
}

export function JobStats({ job }) {
  const { totalRows = 0, processedRows = 0, successfulRows = 0, failedRows = 0 } =
    job.processStats || {}

  return (
    <div className="flex flex-wrap gap-3">
      <Stat label="Total Rows" value={formatNumber(totalRows)} />
      <Stat label="Processed" value={formatNumber(processedRows)} tone="text-status-processing" />
      <Stat label="Successful" value={formatNumber(successfulRows)} tone="text-status-completed" />
      <Stat label="Failed" value={formatNumber(failedRows)} tone="text-status-failed" />
    </div>
  )
}
