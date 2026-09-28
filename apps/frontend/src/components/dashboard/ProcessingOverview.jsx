import { Activity } from 'lucide-react'

import { formatNumber, formatPercent } from '@/utils/formatNumber'

const segment = (count, total) => (total > 0 ? (count / total) * 100 : 0)

export function ProcessingOverview({ processing }) {
  const { totalRows = 0, processedRows = 0, successfulRows = 0, failedRows = 0, remainingRows = 0 } =
    processing || {}

  const activeRows = Math.max(0, processedRows - successfulRows - failedRows)

  const successPct = segment(successfulRows, totalRows)
  const activePct = segment(activeRows, totalRows)
  const failedPct = segment(failedRows, totalRows)
  const remainingPct = Math.max(0, 100 - successPct - activePct - failedPct)

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 items-center justify-center rounded-md bg-surface-active">
            <Activity className="size-4 text-ink-muted" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-ink">Overall Row Processing Activity</h3>
            <p className="text-xs text-ink-muted">
              Cumulative row outcomes across every job in your account
            </p>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-4 font-mono text-[11px] sm:flex">
          <Legend swatchClassName="bg-status-completed" label="Successful" value={successPct} />
          <Legend swatchClassName="bg-status-processing" label="Active" value={activePct} />
          <Legend swatchClassName="bg-status-failed" label="Failed" value={failedPct} />
        </div>
      </div>

      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-active">
        <div className="bg-status-completed" style={{ width: `${successPct}%` }} />
        <div className="bg-status-processing" style={{ width: `${activePct}%` }} />
        <div className="bg-status-failed" style={{ width: `${failedPct}%` }} />
        <div className="bg-surface-active" style={{ width: `${remainingPct}%` }} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Metric label="Total Rows" value={formatNumber(totalRows)} />
        <Metric label="Processed" value={formatNumber(processedRows)} />
        <Metric label="Successful" value={formatNumber(successfulRows)} tone="text-status-completed" />
        <Metric label="Failed" value={formatNumber(failedRows)} tone="text-status-failed" />
        <Metric label="Remaining" value={formatNumber(remainingRows)} tone="text-ink-muted" />
      </div>
    </div>
  )
}

function Legend({ swatchClassName, label, value }) {
  return (
    <span className="flex items-center gap-1.5 text-ink-muted">
      <span className={`size-2 rounded-full ${swatchClassName}`} />
      {label} ({formatPercent(value, { decimals: 1 })})
    </span>
  )
}

function Metric({ label, value, tone = 'text-ink' }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">{label}</span>
      <span className={`text-lg font-semibold tabular-nums ${tone}`}>{value}</span>
    </div>
  )
}
