import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Select } from '@/components/ui/Select'
import { ENRICHMENT_PROVIDERS } from '@/constants/upload.constants'

export function ProcessingOptions({
  jobName,
  onJobNameChange,
  enrichmentEnabled,
  onEnrichmentEnabledChange,
  enrichmentProvider,
  onEnrichmentProviderChange,
  errors = {},
}) {
  return (
    <div className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold text-ink">Processing options</h3>

      <Input
        label="Job name"
        placeholder="e.g. Customer Import — September"
        value={jobName}
        onChange={(event) => onJobNameChange(event.target.value)}
        error={errors.name}
      />

      <div className="rounded-md border border-border bg-base-raised p-3.5">
        <Toggle
          checked={enrichmentEnabled}
          onChange={onEnrichmentEnabledChange}
          label="AI enrichment"
          description="Enrich each row with an AI provider as it's processed"
        />

        {enrichmentEnabled && (
          <div className="mt-3.5 border-t border-border pt-3.5">
            <Select
              label="Enrichment provider"
              value={enrichmentProvider}
              onChange={(event) => onEnrichmentProviderChange(event.target.value)}
              options={ENRICHMENT_PROVIDERS}
              error={errors.enrichmentProvider}
            />
          </div>
        )}
      </div>
    </div>
  )
}
