import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { ArrowUpRight, RotateCcw, Table2, XCircle } from 'lucide-react'

import { useJob } from '@/hooks/useJob'
import { useJobSocket } from '@/hooks/useJobSocket'
import { useExports } from '@/hooks/useExports'
import { useToast } from '@/context/ToastContext'
import { LiveJobProgress } from '@/components/jobs/LiveJobProgress'
import { JobStats } from '@/components/jobs/JobStats'
import { JobTimeline } from '@/components/jobs/JobTimeline'
import { ExportButton } from '@/components/exports/ExportButton'
import { ExportHistory } from '@/components/exports/ExportHistory'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/ErrorState'
import { jobApi } from '@/services/job.api'
import {
  CANCELLABLE_JOB_STATUSES,
  RETRYABLE_JOB_STATUSES,
} from '@/constants/job.constants'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { ROUTES } from '@/constants/routes'

export function JobDetails() {
  const { jobId } = useParams()
  const { setPageHeader } = useOutletContext()
  const navigate = useNavigate()
  const toast = useToast()

  const { job, setJob, isLoading, error, refetch } = useJob(jobId)
  const { isLive } = useJobSocket(jobId, setJob)
  const exportsState = useExports(jobId)

  const [confirmCancel, setConfirmCancel] = useState(false)
  const [isMutating, setIsMutating] = useState(false)

  useEffect(() => {
    setPageHeader({
      breadcrumb: [
        { label: 'Jobs', to: ROUTES.JOBS },
        { label: job?.name || 'Job details' },
      ],
    })
  }, [setPageHeader, job?.name])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="p-10">
        <ErrorState description={error || 'Job not found.'} onRetry={refetch} />
      </div>
    )
  }

  const canCancel = CANCELLABLE_JOB_STATUSES.includes(job.status)
  const canRetry = RETRYABLE_JOB_STATUSES.includes(job.status)

  const handleCancel = async () => {
    setIsMutating(true)
    try {
      await jobApi.cancel(job._id)
      await refetch()
      toast.success('Job cancelled.')
    } catch (cancelError) {
      toast.error(getErrorMessage(cancelError))
    } finally {
      setIsMutating(false)
      setConfirmCancel(false)
    }
  }

  const handleRetry = async () => {
    setIsMutating(true)
    try {
      await jobApi.retry(job._id)
      await refetch()
      toast.success('Job queued for retry.')
    } catch (retryError) {
      toast.error(getErrorMessage(retryError))
    } finally {
      setIsMutating(false)
    }
  }

  const handleDownload = (exportItem) => {
    exportsState.downloadExport(exportItem._id, exportItem.fileName)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">{job.name}</h1>
          <p className="mt-1 font-mono text-xs text-ink-faint">
            JOB-{job._id.slice(-6).toUpperCase()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Table2}
            onClick={() => navigate(`${ROUTES.RESULTS}?jobId=${job._id}`)}
          >
            View results
          </Button>
          {canRetry && (
            <Button variant="secondary" size="sm" icon={RotateCcw} onClick={handleRetry} isLoading={isMutating}>
              Retry
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" size="sm" icon={XCircle} onClick={() => setConfirmCancel(true)}>
              Cancel
            </Button>
          )}
          <ExportButton job={job} isExporting={exportsState.isExporting} onExport={exportsState.createExport} />
        </div>
      </div>

      <LiveJobProgress job={job} isLive={isLive} />

      <JobStats job={job} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Exports</h3>
              <Button
                variant="ghost"
                size="sm"
                icon={ArrowUpRight}
                onClick={() => navigate(`${ROUTES.RESULTS}?jobId=${job._id}`)}
              >
                Inspect rows
              </Button>
            </div>
            <ExportHistory
              exports={exportsState.exports}
              isDownloading={exportsState.isDownloading}
              onDownload={handleDownload}
            />
          </div>
        </div>

        <JobTimeline job={job} />
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        title="Cancel this job?"
        description="Processing will stop as soon as possible. Rows already processed are kept."
        confirmLabel="Cancel job"
        variant="danger"
        isLoading={isMutating}
      />
    </div>
  )
}
