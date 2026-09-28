export function EnrichmentStats({ stats = [] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border border-border bg-surface px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">{stat.label}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-ink">{stat.value}</p>
        </div>
      ))}
    </div>
  )
}
