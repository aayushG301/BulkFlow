import { Link } from 'react-router-dom'
import { AlertTriangle, Info } from 'lucide-react'

import { EnrichmentProvider } from '@/components/enrichment/EnrichmentProvider'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'

// `enrichmentStatus` comes from GET /dashboard (`data.enrichment`) so
// this reflects whether Gemini is actually callable on the backend
// right now, not just whether it's selectable in the upload form.
export function EnrichmentSettings({ enrichmentStatus }) {
  const geminiConfigured = Boolean(enrichmentStatus?.geminiConfigured)
  const model = enrichmentStatus?.geminiModel

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
          description={
            geminiConfigured
              ? `Connected${model ? ` · ${model}` : ''} - used for every enrichment-enabled job`
              : 'Selectable when creating an upload, but no API key is configured yet'
          }
          status={geminiConfigured ? 'available' : 'not-connected'}
        />
        <EnrichmentProvider
          name="Mock provider"
          description={
            geminiConfigured
              ? 'Used only if a Gemini call fails for a row'
              : 'Used automatically until a Gemini API key is configured'
          }
          status="available"
        />
      </div>

      {geminiConfigured ? (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-accent/20 bg-accent-soft px-3 py-2.5">
          <Info className="mt-0.5 size-4 shrink-0 text-accent" />
          <p className="text-xs text-ink-muted">
            Gemini is configured on the backend. Rows from enrichment-enabled jobs are sent to
            Gemini; if a single row's call fails (rate limit, timeout), that row falls back to the
            mock provider rather than failing the whole row.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-status-warning/30 bg-status-warning-soft px-3 py-2.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-status-warning" />
          <p className="text-xs text-ink-muted">
            No <code className="font-mono">GEMINI_API_KEY</code> is configured on the backend, so
            every enrichment call currently falls back to the mock provider, which doesn't add any
            real information. Add a key from Google AI Studio to the backend's{' '}
            <code className="font-mono">.env</code> to enable real enrichment.
          </p>
        </div>
      )}

      <Button as={Link} to={ROUTES.NEW_UPLOAD} variant="secondary" size="sm" className="mt-4">
        Start an upload with enrichment
      </Button>
    </div>
  )
}
