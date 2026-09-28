import { Sparkles } from 'lucide-react'

export function ResultEnrichment({ enrichmentData, resultStatus }) {
  if (!enrichmentData) {
    return (
      <div className="rounded-lg border border-border bg-base-raised p-3.5">
        <div className="flex items-center gap-2.5">
          <Sparkles className="size-4 text-ink-faint" />
          <div>
            <p className="text-sm font-medium text-ink">AI enrichment</p>
            <p className="text-xs text-ink-muted">
              {resultStatus === 'failed'
                ? 'Skipped - upstream validation failed before enrichment could run.'
                : 'Not enriched yet.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-accent/30 bg-accent-soft p-3.5">
      <div className="flex items-center gap-2.5">
        <Sparkles className="size-4 text-accent" />
        <div>
          <p className="text-sm font-medium text-accent">AI enrichment</p>
          <p className="text-xs text-ink-muted">
            Provider: <span className="font-mono text-ink">{enrichmentData.provider}</span>
          </p>
        </div>
      </div>
      <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-base-raised px-3 py-2 font-mono text-xs text-ink">
        {JSON.stringify(enrichmentData.data, null, 2)}
      </pre>
    </div>
  )
}
