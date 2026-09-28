import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'

const toDate = (value) => {
  if (!value) return null
  const date = typeof value === 'string' ? parseISO(value) : new Date(value)
  return isValid(date) ? date : null
}

// "12m ago", "2h ago", "Just now" - matches the reference UI's relative
// timestamps in the recent jobs table.
export const formatRelativeTime = (value) => {
  const date = toDate(value)
  if (!date) return '—'

  const seconds = (Date.now() - date.getTime()) / 1000
  if (seconds < 45) return 'Just now'

  return `${formatDistanceToNowStrict(date, { addSuffix: false })} ago`
}

export const formatDateTime = (value) => {
  const date = toDate(value)
  if (!date) return '—'
  return format(date, 'MMM d, yyyy · HH:mm')
}

export const formatDate = (value) => {
  const date = toDate(value)
  if (!date) return '—'
  return format(date, 'MMM d, yyyy')
}
