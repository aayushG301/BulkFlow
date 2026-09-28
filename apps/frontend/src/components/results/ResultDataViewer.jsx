export function ResultDataViewer({ title, data }) {
  const isEmpty = data === null || data === undefined

  return (
    <div className="rounded-lg border border-border bg-base-raised">
      <div className="flex items-center justify-between border-b border-border px-3.5 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">{title}</span>
        <span className="font-mono text-[10px] text-ink-faint">application/json</span>
      </div>
      <pre className="max-h-72 overflow-auto px-3.5 py-3 font-mono text-xs leading-relaxed text-ink">
        {isEmpty ? (
          <span className="text-ink-faint">null</span>
        ) : (
          JSON.stringify(data, null, 2)
        )}
      </pre>
    </div>
  )
}
