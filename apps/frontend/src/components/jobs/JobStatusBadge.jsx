import { Badge } from '@/components/ui/Badge'
import { JOB_STATUS_META } from '@/constants/job.constants'

export function JobStatusBadge({ status, className }) {
  const meta = JOB_STATUS_META[status] || { label: status, tone: 'neutral', live: false }

  return (
    <Badge tone={meta.tone} dot live={meta.live} className={className}>
      {meta.label}
    </Badge>
  )
}
