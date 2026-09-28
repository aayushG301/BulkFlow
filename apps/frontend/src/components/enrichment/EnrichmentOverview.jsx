import { ArrowRight, Cpu, Database, Sparkles } from 'lucide-react'

const STAGES = [
  { icon: Database, label: 'Enrichment Service', description: 'Reads each pending row' },
  { icon: Cpu, label: 'Provider Interface', description: 'Routes to the configured provider' },
  { icon: Sparkles, label: 'Provider', description: 'Returns enriched fields' },
]

export function EnrichmentOverview() {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h3 className="text-sm font-semibold text-ink">How enrichment works</h3>
      <p className="mt-1 max-w-2xl text-sm text-ink-muted">
        When enrichment is enabled on an upload, the processing worker sends every row through the
        enrichment pipeline before it's marked complete. The result is stored alongside the row and
        shown in Result Details.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {STAGES.map((stage, index) => (
          <div key={stage.label} className="flex items-center gap-2">
            <div className="flex items-center gap-2.5 rounded-md border border-border bg-base-raised px-3.5 py-2.5">
              <stage.icon className="size-4 text-accent" />
              <div>
                <p className="text-xs font-medium text-ink">{stage.label}</p>
                <p className="text-[11px] text-ink-faint">{stage.description}</p>
              </div>
            </div>
            {index < STAGES.length - 1 && <ArrowRight className="size-4 shrink-0 text-ink-faint" />}
          </div>
        ))}
      </div>
    </div>
  )
}
