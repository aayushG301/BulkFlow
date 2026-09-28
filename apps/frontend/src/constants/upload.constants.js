export const UPLOAD_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  COMPLETED_WITH_ERRORS: 'completed_with_errors',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
}

export const UPLOAD_STATUS_META = {
  [UPLOAD_STATUS.QUEUED]: { label: 'Queued', tone: 'queued' },
  [UPLOAD_STATUS.PROCESSING]: { label: 'Processing', tone: 'processing' },
  [UPLOAD_STATUS.COMPLETED]: { label: 'Completed', tone: 'completed' },
  [UPLOAD_STATUS.COMPLETED_WITH_ERRORS]: { label: 'Completed with errors', tone: 'warning' },
  [UPLOAD_STATUS.FAILED]: { label: 'Failed', tone: 'failed' },
  [UPLOAD_STATUS.CANCELLED]: { label: 'Cancelled', tone: 'cancelled' },
}

// Matches the backend's upload.validation.js exactly
export const ACCEPTED_FILE_EXTENSIONS = ['.csv', '.xls', '.xlsx']
export const ACCEPTED_MIME_TYPES = [
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024

export const ENRICHMENT_PROVIDERS = [{ value: 'gemini', label: 'Gemini' }]
