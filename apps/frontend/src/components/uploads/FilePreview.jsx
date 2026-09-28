import { FileSpreadsheet, X } from 'lucide-react'

import { formatFileSize } from '@/utils/formatFileSize'

export function FilePreview({ file, onRemove, disabled }) {
  if (!file) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-active">
        <FileSpreadsheet className="size-5 text-accent" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm text-ink">{file.name}</p>
        <p className="text-xs text-ink-muted">{formatFileSize(file.size)}</p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Remove file"
          className="shrink-0 rounded-md p-1.5 text-ink-faint hover:bg-surface-hover hover:text-ink disabled:opacity-50"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
