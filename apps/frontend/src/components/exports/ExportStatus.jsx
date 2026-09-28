import { Badge } from '@/components/ui/Badge'

const META = {
  queued: { label: 'Queued', tone: 'queued' },
  processing: { label: 'Processing', tone: 'processing', live: true },
  completed: { label: 'Ready', tone: 'completed' },
  failed: { label: 'Failed', tone: 'failed' },
}

export function ExportStatus({ status }) {
  const meta = META[status] || { label: status, tone: 'neutral' }

  return (
    <Badge tone={meta.tone} dot live={meta.live}>
      {meta.label}
    </Badge>
  )
}
