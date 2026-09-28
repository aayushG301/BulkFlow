import { AlertTriangle } from 'lucide-react'

export function ResultError({ error }) {
  if (!error?.message && !error?.code) return null

  return (
    <div className="rounded-lg border border-status-warning/30 bg-status-warning-soft p-3.5">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-status-warning" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-status-warning">Validation diagnostic</p>
          <p className="mt-0.5 text-sm text-ink-muted">{error.message}</p>
          {error.code && (
            <p className="mt-2 font-mono text-[11px] text-ink-faint">
              code: <span className="text-ink-muted">{error.code}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
