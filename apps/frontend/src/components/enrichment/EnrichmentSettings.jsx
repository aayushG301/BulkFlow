import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'

import { EnrichmentProvider } from '@/components/enrichment/EnrichmentProvider'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'

export function EnrichmentSettings() {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold text-ink">Providers</h3>
      <p className="mt-1 text-xs text-ink-muted">
        Enrichment is turned on per upload, not globally - choose a provider when you start a new
        job.
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        <EnrichmentProvider
          name="Gemini"
          description="Selectable when creating an upload"
          status="available"
        />
        <EnrichmentProvider
          name="Mock provider"
          description="Used automatically until a live provider is connected"
          status="available"
        />
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-md border border-accent/20 bg-accent-soft px-3 py-2.5">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" />
        <p className="text-xs text-ink-muted">
          Every enrichment call currently runs through the mock provider so rows always enrich
          predictably in this environment. Connecting a live provider is the next step on the
          backend roadmap.
        </p>
      </div>

      <Button as={Link} to={ROUTES.NEW_UPLOAD} variant="secondary" size="sm" className="mt-4">
        Start an upload with enrichment
      </Button>
    </div>
  )
}
