import clsx from 'clsx'

const FILL_TONES = {
  processing: 'bg-status-processing',
  queued: 'bg-status-queued',
  completed: 'bg-status-completed',
  warning: 'bg-status-warning',
  failed: 'bg-status-failed',
  cancelled: 'bg-status-cancelled',
  accent: 'bg-accent',
}

export function ProgressBar({ value = 0, tone = 'accent', size = 'md', className }) {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0))

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={clsx(
        'w-full overflow-hidden rounded-full bg-surface-active',
        size === 'sm' ? 'h-1' : 'h-1.5',
        className,
      )}
    >
      <div
        className={clsx('h-full rounded-full transition-all duration-500 ease-out', FILL_TONES[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
