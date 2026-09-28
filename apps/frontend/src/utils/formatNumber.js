export const formatNumber = (value) => {
  const number = Number(value)
  if (Number.isNaN(number)) return '—'
  return new Intl.NumberFormat('en-US').format(number)
}

export const formatCompactNumber = (value) => {
  const number = Number(value)
  if (Number.isNaN(number)) return '—'
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    number,
  )
}

export const formatPercent = (value, { decimals = 0 } = {}) => {
  const number = Number(value)
  if (Number.isNaN(number)) return '—'
  return `${number.toFixed(decimals)}%`
}
