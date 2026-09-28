import { FileSpreadsheet, Sparkles, Tag } from 'lucide-react'

import { formatFileSize } from '@/utils/formatFileSize'
import { ENRICHMENT_PROVIDERS } from '@/constants/upload.constants'

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="flex items-center gap-2 text-sm text-ink-muted">
        <Icon className="size-4 text-ink-faint" />
        {label}
      </span>
      <span className="truncate text-sm font-medium text-ink">{value}</span>
    </div>
  )
}

export function UploadReview({ file, jobName, enrichmentEnabled, enrichmentProvider }) {
  const providerLabel = ENRICHMENT_PROVIDERS.find((p) => p.value === enrichmentProvider)?.label

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold text-ink">Ready to start</h3>
      <p className="mt-1 text-xs text-ink-muted">
        Review the details below, then start processing to queue ingestion.
      </p>

      <div className="mt-3 divide-y divide-border">
        <Row icon={FileSpreadsheet} label="Source file" value={`${file.name} · ${formatFileSize(file.size)}`} />
        <Row icon={Tag} label="Job name" value={jobName} />
        <Row
          icon={Sparkles}
          label="AI enrichment"
          value={enrichmentEnabled ? `Enabled · ${providerLabel}` : 'Disabled'}
        />
      </div>
    </div>
  )
}
