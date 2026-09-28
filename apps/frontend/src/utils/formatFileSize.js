const UNITS = ['B', 'KB', 'MB', 'GB', 'TB']

export const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined || Number.isNaN(Number(bytes))) return '—'
  if (bytes === 0) return '0 B'

  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1)
  const value = bytes / 1024 ** exponent

  return `${exponent === 0 ? value : value.toFixed(value >= 10 ? 0 : 1)} ${UNITS[exponent]}`
}
