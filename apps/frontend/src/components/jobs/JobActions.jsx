import { useState } from 'react'
import { Download, Eye, MoreHorizontal, RotateCcw, Trash2, XCircle } from 'lucide-react'

import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  CANCELLABLE_JOB_STATUSES,
  DELETABLE_JOB_STATUSES,
  EXPORTABLE_JOB_STATUSES,
  RETRYABLE_JOB_STATUSES,
} from '@/constants/job.constants'

export function JobActions({ job, onView, onCancel, onRetry, onExport, onDelete }) {
  const [pendingAction, setPendingAction] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canCancel = CANCELLABLE_JOB_STATUSES.includes(job.status)
  const canRetry = RETRYABLE_JOB_STATUSES.includes(job.status)
  const canExport = EXPORTABLE_JOB_STATUSES.includes(job.status)
  const canDelete = DELETABLE_JOB_STATUSES.includes(job.status)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      if (pendingAction === 'cancel') await onCancel?.(job)
      if (pendingAction === 'delete') await onDelete?.(job)
      setPendingAction(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dropdown
        trigger={
          <button
            type="button"
            aria-label="Job actions"
            className="rounded-md p-1.5 text-ink-faint hover:bg-surface-hover hover:text-ink"
          >
            <MoreHorizontal className="size-4" />
          </button>
        }
      >
        {({ close }) => (
          <>
            {onView && (
              <DropdownItem
                icon={Eye}
                onClick={() => {
                  close()
                  onView(job)
                }}
              >
                View details
              </DropdownItem>
            )}
            {canRetry && (
              <DropdownItem
                icon={RotateCcw}
                onClick={() => {
                  close()
                  onRetry?.(job)
                }}
              >
                Retry job
              </DropdownItem>
            )}
            {canExport && (
              <DropdownItem
                icon={Download}
                onClick={() => {
                  close()
                  onExport?.(job)
                }}
              >
                Export CSV
              </DropdownItem>
            )}
            {canCancel && (
              <DropdownItem
                icon={XCircle}
                onClick={() => {
                  close()
                  setPendingAction('cancel')
                }}
              >
                Cancel job
              </DropdownItem>
            )}
            {canDelete && (
              <DropdownItem
                icon={Trash2}
                danger
                onClick={() => {
                  close()
                  setPendingAction('delete')
                }}
              >
                Delete job
              </DropdownItem>
            )}
          </>
        )}
      </Dropdown>

      <ConfirmDialog
        open={pendingAction === 'cancel'}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirm}
        title="Cancel this job?"
        description="Processing will stop as soon as possible. Rows already processed are kept."
        confirmLabel="Cancel job"
        variant="danger"
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        open={pendingAction === 'delete'}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirm}
        title="Delete this job?"
        description="This permanently removes the job and its results. This can't be undone."
        confirmLabel="Delete job"
        variant="danger"
        isLoading={isSubmitting}
      />
    </>
  )
}
