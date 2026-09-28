import { Check, CircleDashed, Loader2, X } from 'lucide-react'
import clsx from 'clsx'

import { JOB_STATUS } from '@/constants/job.constants'
import { formatDateTime } from '@/utils/formatDate'

const TERMINAL_LABELS = {
  [JOB_STATUS.COMPLETED]: 'Completed',
  [JOB_STATUS.COMPLETED_WITH_ERRORS]: 'Completed with errors',
  [JOB_STATUS.FAILED]: 'Failed',
  [JOB_STATUS.CANCELLED]: 'Cancelled',
}

export function JobTimeline({ job }) {
  const isTerminal = Boolean(job.completedAt)
  const hasStarted = Boolean(job.startedAt)

  const steps = [
    {
      key: 'created',
      label: 'Job created',
      timestamp: job.createdAt,
      state: 'done',
    },
    {
      key: 'started',
      label: 'Processing started',
      timestamp: job.startedAt,
      state: hasStarted ? 'done' : job.status === JOB_STATUS.QUEUED ? 'pending' : 'active',
    },
    {
      key: 'finished',
      label: isTerminal ? TERMINAL_LABELS[job.status] || 'Finished' : 'Processing',
      timestamp: job.completedAt,
      state: isTerminal ? (job.status === JOB_STATUS.FAILED ? 'failed' : 'done') : 'active',
    },
  ]

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h3 className="mb-4 text-sm font-semibold text-ink">Timeline</h3>
      <ol className="flex flex-col gap-0">
        {steps.map((step, index) => (
          <li key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StepIcon state={step.state} />
              {index < steps.length - 1 && (
                <span
                  className={clsx(
                    'my-1 w-px flex-1',
                    step.state === 'done' ? 'bg-status-completed/40' : 'bg-border-strong',
                  )}
                  style={{ minHeight: 20 }}
                />
              )}
            </div>
            <div className="pb-5">
              <p
                className={clsx(
                  'text-sm',
                  step.state === 'pending' ? 'text-ink-faint' : 'font-medium text-ink',
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-ink-faint">
                {step.timestamp ? formatDateTime(step.timestamp) : 'Pending'}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function StepIcon({ state }) {
  if (state === 'done') {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-status-completed-soft text-status-completed">
        <Check className="size-3" />
      </span>
    )
  }

  if (state === 'failed') {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-status-failed-soft text-status-failed">
        <X className="size-3" />
      </span>
    )
  }

  if (state === 'active') {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-status-processing-soft text-status-processing">
        <Loader2 className="size-3 animate-spin" />
      </span>
    )
  }

  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-active text-ink-faint">
      <CircleDashed className="size-3" />
    </span>
  )
}
