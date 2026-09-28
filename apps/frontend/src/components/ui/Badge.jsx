import clsx from 'clsx'

const TONES = {
  processing: 'bg-status-processing-soft text-status-processing',
  queued: 'bg-status-queued-soft text-status-queued',
  completed: 'bg-status-completed-soft text-status-completed',
  warning: 'bg-status-warning-soft text-status-warning',
  failed: 'bg-status-failed-soft text-status-failed',
  cancelled: 'bg-status-cancelled-soft text-status-cancelled',
  accent: 'bg-accent-soft text-accent',
  neutral: 'bg-surface-active text-ink-muted',
}

const DOT_TONES = {
  processing: 'bg-status-processing',
  queued: 'bg-status-queued',
  completed: 'bg-status-completed',
  warning: 'bg-status-warning',
  failed: 'bg-status-failed',
  cancelled: 'bg-status-cancelled',
  accent: 'bg-accent',
  neutral: 'bg-ink-muted',
}

export function Badge({ tone = 'neutral', dot = false, live = false, className, children }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide',
        TONES[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={clsx(
            'size-1.5 rounded-full',
            DOT_TONES[tone],
            live && 'animate-pulse-dot',
          )}
        />
      )}
      {children}
    </span>
  )
}
