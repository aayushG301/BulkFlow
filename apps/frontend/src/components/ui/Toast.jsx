import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import clsx from 'clsx'

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    classes: 'border-status-completed/30 bg-status-completed-soft text-status-completed',
  },
  error: {
    icon: XCircle,
    classes: 'border-status-failed/30 bg-status-failed-soft text-status-failed',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'border-status-warning/30 bg-status-warning-soft text-status-warning',
  },
  info: {
    icon: Info,
    classes: 'border-accent/30 bg-accent-soft text-accent',
  },
}

function Toast({ variant = 'info', title, message, onDismiss }) {
  const { icon: Icon, classes } = VARIANTS[variant] || VARIANTS.info

  return (
    <div
      role="alert"
      className={clsx(
        'flex w-80 items-start gap-3 rounded-lg border bg-surface p-3.5 shadow-panel',
      )}
    >
      <span className={clsx('flex size-7 shrink-0 items-center justify-center rounded-md', classes)}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        {title && <p className="text-sm font-medium text-ink">{title}</p>}
        <p className="text-sm text-ink-muted">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 rounded p-0.5 text-ink-faint hover:text-ink"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

export function ToastViewport({ toasts, onDismiss }) {
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>,
    document.body,
  )
}
