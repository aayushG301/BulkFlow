import clsx from 'clsx'

const TONES = {
  neutral: 'text-ink',
  accent: 'text-accent',
  completed: 'text-status-completed',
  failed: 'text-status-failed',
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'neutral', live = false }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
          {label}
        </span>
        {live && (
          <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide text-status-processing">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-status-processing" />
            Live
          </span>
        )}
        {Icon && !live && <Icon className="size-3.5 text-ink-faint" />}
      </div>
      <span className={clsx('text-2xl font-semibold tabular-nums', TONES[tone])}>{value}</span>
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </div>
  )
}
