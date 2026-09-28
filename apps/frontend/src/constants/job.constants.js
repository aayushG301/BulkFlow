export const JOB_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  COMPLETED_WITH_ERRORS: 'completed_with_errors',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
}

export const JOB_STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: JOB_STATUS.PROCESSING, label: 'Processing' },
  { value: JOB_STATUS.QUEUED, label: 'Queued' },
  { value: JOB_STATUS.COMPLETED, label: 'Completed' },
  { value: JOB_STATUS.COMPLETED_WITH_ERRORS, label: 'Completed with errors' },
  { value: JOB_STATUS.FAILED, label: 'Failed' },
  { value: JOB_STATUS.CANCELLED, label: 'Cancelled' },
]

// Presentation config per status: label, tone (maps to a status color
// token) and whether a live pulse dot should render next to it.
export const JOB_STATUS_META = {
  [JOB_STATUS.QUEUED]: { label: 'Queued', tone: 'queued', live: false },
  [JOB_STATUS.PROCESSING]: { label: 'Processing', tone: 'processing', live: true },
  [JOB_STATUS.COMPLETED]: { label: 'Completed', tone: 'completed', live: false },
  [JOB_STATUS.COMPLETED_WITH_ERRORS]: {
    label: 'Completed with errors',
    tone: 'warning',
    live: false,
  },
  [JOB_STATUS.FAILED]: { label: 'Failed', tone: 'failed', live: false },
  [JOB_STATUS.CANCELLED]: { label: 'Cancelled', tone: 'cancelled', live: false },
}

export const CANCELLABLE_JOB_STATUSES = [JOB_STATUS.QUEUED, JOB_STATUS.PROCESSING]
export const RETRYABLE_JOB_STATUSES = [JOB_STATUS.FAILED, JOB_STATUS.COMPLETED_WITH_ERRORS]
export const EXPORTABLE_JOB_STATUSES = [JOB_STATUS.COMPLETED, JOB_STATUS.COMPLETED_WITH_ERRORS]
export const DELETABLE_JOB_STATUSES = [
  JOB_STATUS.QUEUED,
  JOB_STATUS.COMPLETED,
  JOB_STATUS.COMPLETED_WITH_ERRORS,
  JOB_STATUS.FAILED,
  JOB_STATUS.CANCELLED,
]
