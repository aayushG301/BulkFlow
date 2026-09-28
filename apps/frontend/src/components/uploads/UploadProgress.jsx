import { ProgressBar } from '@/components/ui/ProgressBar'

export function UploadProgress({ progress, label = 'Uploading file…' }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-4 py-3.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-muted">{label}</span>
        <span className="font-mono tabular-nums text-ink">{progress}%</span>
      </div>
      <ProgressBar value={progress} tone="processing" />
    </div>
  )
}
