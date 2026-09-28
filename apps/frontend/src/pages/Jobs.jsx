import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import { useJobs } from '@/hooks/useJobs'
import { useToast } from '@/context/ToastContext'
import { JobTable } from '@/components/jobs/JobTable'
import { JobFilters } from '@/components/jobs/JobFilters'
import { Pagination } from '@/components/ui/Pagination'
import { jobApi } from '@/services/job.api'
import { exportApi } from '@/services/export.api'
import { JOB_STATUS_FILTERS } from '@/constants/job.constants'
import { getErrorMessage } from '@/utils/getErrorMessage'

export function Jobs() {
  const { setPageHeader } = useOutletContext()
  const [status, setStatus] = useState('')
  const [counts, setCounts] = useState({})
  const toast = useToast()

  const { jobs, pagination, page, setPage, isLoading, error, refetch, cancelJob, retryJob, deleteJob } =
    useJobs({ status })

  useEffect(() => {
    setPageHeader({ breadcrumb: [{ label: 'Jobs' }] })
  }, [setPageHeader])

  // Lightweight per-status counts (pageSize 1, so only pagination.total
  // is used) so the filter tabs can show real numbers like the
  // reference design, without a dedicated backend aggregate endpoint.
  useEffect(() => {
    let cancelled = false

    const loadCounts = async () => {
      const results = await Promise.all(
        JOB_STATUS_FILTERS.map((filter) =>
          jobApi
            .list({ page: 1, pageSize: 1, status: filter.value })
            .then((response) => [filter.value, response.data.data.pagination.total])
            .catch(() => [filter.value, undefined]),
        ),
      )

      if (!cancelled) setCounts(Object.fromEntries(results))
    }

    loadCounts()
    return () => {
      cancelled = true
    }
  }, [jobs])

  const handleExport = async (job) => {
    try {
      const response = await exportApi.create(job._id)
      toast.success('Export started - check the job details page shortly.')
      return response
    } catch (exportError) {
      toast.error(getErrorMessage(exportError, 'Could not start the export.'))
    }
  }

  const withErrorHandling = (action, successMessage) => async (job) => {
    try {
      await action(job._id)
      if (successMessage) toast.success(successMessage)
    } catch (actionError) {
      toast.error(getErrorMessage(actionError))
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Processing Jobs</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Monitor, retry, and manage all background ingestion jobs.
        </p>
      </div>

      <JobFilters activeStatus={status} onChange={setStatus} counts={counts} />

      <JobTable
        jobs={jobs}
        isLoading={isLoading}
        error={error}
        onRetryLoad={refetch}
        onCancel={withErrorHandling(cancelJob, 'Job cancelled.')}
        onRetry={withErrorHandling(retryJob, 'Job queued for retry.')}
        onDelete={withErrorHandling(deleteJob, 'Job deleted.')}
        onExport={handleExport}
      />

      {pagination && (
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>
            Showing {jobs.length === 0 ? 0 : (page - 1) * pagination.limit + 1}–
            {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} jobs
          </span>
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
