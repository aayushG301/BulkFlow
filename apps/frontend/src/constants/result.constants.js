export const RESULT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
}

export const RESULT_STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: RESULT_STATUS.COMPLETED, label: 'Completed' },
  { value: RESULT_STATUS.FAILED, label: 'Failed' },
  { value: RESULT_STATUS.PROCESSING, label: 'Processing' },
  { value: RESULT_STATUS.PENDING, label: 'Pending' },
]

export const RESULT_STATUS_META = {
  [RESULT_STATUS.PENDING]: { label: 'Pending', tone: 'queued' },
  [RESULT_STATUS.PROCESSING]: { label: 'Processing', tone: 'processing' },
  [RESULT_STATUS.COMPLETED]: { label: 'Completed', tone: 'completed' },
  [RESULT_STATUS.FAILED]: { label: 'Failed', tone: 'failed' },
}
