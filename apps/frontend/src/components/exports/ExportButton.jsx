import { Download } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { EXPORTABLE_JOB_STATUSES } from '@/constants/job.constants'

export function ExportButton({ job, isExporting, onExport, size = 'md' }) {
  const canExport = EXPORTABLE_JOB_STATUSES.includes(job.status)

  return (
    <Button
      variant="primary"
      size={size}
      icon={Download}
      onClick={onExport}
      isLoading={isExporting}
      disabled={!canExport}
      title={canExport ? undefined : 'Export becomes available once the job has completed'}
    >
      Export CSV
    </Button>
  )
}
