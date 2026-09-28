import { Badge } from '@/components/ui/Badge'
import { RESULT_STATUS_META } from '@/constants/result.constants'

export function ResultStatusBadge({ status, className }) {
  const meta = RESULT_STATUS_META[status] || { label: status, tone: 'neutral' }

  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  )
}
