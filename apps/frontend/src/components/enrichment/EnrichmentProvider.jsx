import { Badge } from '@/components/ui/Badge'

export function EnrichmentProvider({ name, description, status = 'available' }) {
  const isAvailable = status === 'available'

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-surface p-4">
      <div>
        <p className="text-sm font-medium text-ink">{name}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
      </div>
      <Badge tone={isAvailable ? 'completed' : 'warning'}>
        {isAvailable ? 'Available' : 'Not connected'}
      </Badge>
    </div>
  )
}
