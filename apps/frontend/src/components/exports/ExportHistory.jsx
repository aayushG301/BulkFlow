import { Download, FileDown } from 'lucide-react'

import { ExportStatus } from '@/components/exports/ExportStatus'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTime } from '@/utils/formatDate'

export function ExportHistory({ exports, isDownloading, onDownload }) {
  if (exports.length === 0) {
    return (
      <EmptyState
        icon={FileDown}
        title="No exports yet"
        description="Export this job's results to CSV once it has finished processing."
      />
    )
  }

  return (
    <ul className="divide-y divide-border">
      {exports.map((exportItem) => (
        <li key={exportItem._id} className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-mono text-sm text-ink">
              {exportItem.fileName || `export-${exportItem._id.slice(-6)}.csv`}
            </p>
            <p className="text-xs text-ink-faint">{formatDateTime(exportItem.createdAt)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <ExportStatus status={exportItem.status} />
            {exportItem.status === 'completed' && (
              <Button
                variant="ghost"
                size="sm"
                icon={Download}
                isLoading={isDownloading}
                onClick={() => onDownload(exportItem)}
              >
                Download
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
