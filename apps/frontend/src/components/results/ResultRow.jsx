import { Link } from 'react-router-dom'

import { ResultStatusBadge } from '@/components/results/ResultStatusBadge'
import { resultDetailsPath } from '@/constants/routes'

const summarize = (data) => {
  if (!data || typeof data !== 'object') return '—'
  const values = Object.values(data).filter(Boolean)
  return values.slice(0, 3).join(' · ') || '—'
}

export function ResultRow({ result }) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-surface-hover">
      <td className="px-5 py-3 font-mono text-xs tabular-nums text-ink-muted">
        #{String(result.rowNum).padStart(4, '0')}
      </td>
      <td className="px-5 py-3">
        <ResultStatusBadge status={result.status} />
      </td>
      <td className="max-w-[220px] truncate px-5 py-3 text-sm text-ink">
        {summarize(result.originalData)}
      </td>
      <td className="max-w-[220px] truncate px-5 py-3 text-sm text-ink-muted">
        {result.status === 'failed' ? (
          <span className="text-status-failed">{result.error?.message || 'Failed'}</span>
        ) : (
          summarize(result.processedData)
        )}
      </td>
      <td className="px-5 py-3 text-right">
        <Link
          to={resultDetailsPath(result._id)}
          className="text-xs font-medium text-accent hover:underline"
        >
          Inspect
        </Link>
      </td>
    </tr>
  )
}
