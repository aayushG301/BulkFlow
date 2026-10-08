import { useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'

import { useResults } from '@/hooks/useResults'
import { useDebounce } from '@/hooks/useDebounce'
import { useToast } from '@/context/ToastContext'
import { useExports } from '@/hooks/useExports'
import { useJobSocket } from '@/hooks/useJobSocket'
import { jobApi } from '@/services/job.api'
import { ResultsTable } from '@/components/results/ResultsTable'
import { ResultFilters } from '@/components/results/ResultFilters'
import { Select } from '@/components/ui/Select'
import { Pagination } from '@/components/ui/Pagination'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Download } from 'lucide-react'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { formatNumber } from '@/utils/formatNumber'

// Statuses where rows can still change - while the active job is in
// one of these, the results table refreshes itself automatically.
const ACTIVE_JOB_STATUSES = ['queued', 'processing']
const POLL_INTERVAL_MS = 4000

export function Results() {
  const { setPageHeader } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()

  const [jobs, setJobs] = useState([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)

  const jobId = searchParams.get('jobId') || ''

  useEffect(() => {
    let cancelled = false

    const loadJobs = async () => {
      setIsLoadingJobs(true)
      try {
        const response = await jobApi.list({ page: 1, pageSize: 25 })
        if (cancelled) return

        const jobList = response.data.data.jobs
        setJobs(jobList)

        if (!jobId && jobList.length > 0) {
          setSearchParams({ jobId: jobList[0]._id }, { replace: true })
        }
      } finally {
        if (!cancelled) setIsLoadingJobs(false)
      }
    }

    loadJobs()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { results, pagination, stats, page, setPage, isLoading, error, refetch } = useResults(jobId, {
    status,
  })

  const exportsState = useExports(jobId)

  const activeJob = useMemo(() => jobs.find((j) => j._id === jobId), [jobs, jobId])

  // The results list itself has no dedicated socket event per row, so
  // "live" here means: while this job is still queued/processing, join
  // its room for an immediate nudge on every status/progress tick, and
  // poll as a fallback in case a tick is missed or the socket drops.
  const [liveJobStatus, setLiveJobStatus] = useState(activeJob?.status)
  const pollTimer = useRef(null)

  useEffect(() => {
    setLiveJobStatus(activeJob?.status)
  }, [activeJob?.status])

  const { isLive } = useJobSocket(jobId, (patch) => {
    if (patch.status) setLiveJobStatus(patch.status)
    refetch()
  })

  const isJobActive = ACTIVE_JOB_STATUSES.includes(liveJobStatus)

  useEffect(() => {
    if (!jobId || !isJobActive) return undefined

    pollTimer.current = setInterval(refetch, POLL_INTERVAL_MS)
    return () => clearInterval(pollTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, isJobActive])

  useEffect(() => {
    setPageHeader({
      breadcrumb: [
        { label: 'Results' },
        ...(activeJob ? [{ label: activeJob.name }] : []),
      ],
    })
  }, [setPageHeader, activeJob])

  const filteredResults = useMemo(() => {
    if (!debouncedSearch.trim()) return results
    const needle = debouncedSearch.trim().toLowerCase()
    return results.filter((result) => {
      const haystack = JSON.stringify(result.originalData) + JSON.stringify(result.processedData)
      return haystack.toLowerCase().includes(needle)
    })
  }, [results, debouncedSearch])

  const handleExport = async () => {
    try {
      await exportsState.createExport()
      toast.success('Export started.')
    } catch (exportError) {
      toast.error(getErrorMessage(exportError, 'Could not start the export.'))
    }
  }

  if (isLoadingJobs) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <Spinner size="lg" />
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="mx-auto max-w-2xl p-10 text-center">
        <h1 className="text-lg font-semibold text-ink">No results yet</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Start a new upload to generate your first batch of processing results.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-ink">Batch Processing Results</h1>
            {isJobActive && (
              <span className="flex items-center gap-1.5 rounded-full bg-status-processing-soft px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide text-status-processing">
                <span className="size-1.5 animate-pulse-dot rounded-full bg-status-processing" />
                {isLive ? 'Live' : 'Refreshing'}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            Row-level inspection for a single job.
            {isJobActive && ' This table updates automatically while the job runs.'}
          </p>
        </div>
        <Button variant="primary" size="sm" icon={Download} onClick={handleExport} isLoading={exportsState.isExporting}>
          Export CSV
        </Button>
      </div>

      <Select
        value={jobId}
        onChange={(event) => setSearchParams({ jobId: event.target.value })}
        options={jobs.map((j) => ({
          value: j._id,
          label: `${j.name} (${formatNumber(j.processStats?.totalRows || 0)} rows)`,
        }))}
        containerClassName="max-w-md"
      />

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill label="Total" value={stats.total} />
          <StatPill label="Completed" value={stats.completed} tone="text-status-completed" />
          <StatPill label="Failed" value={stats.failed} tone="text-status-failed" />
          <StatPill label="Pending" value={stats.pending + stats.processing} tone="text-status-processing" />
        </div>
      )}

      <ResultFilters
        activeStatus={status}
        onStatusChange={setStatus}
        search={search}
        onSearchChange={setSearch}
      />

      <ResultsTable
        results={filteredResults}
        isLoading={isLoading}
        error={error}
        onRetryLoad={refetch}
      />

      {pagination && !debouncedSearch && (
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>
            Showing {results.length === 0 ? 0 : (page - 1) * pagination.limit + 1}–
            {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} rows
          </span>
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}

function StatPill({ label, value, tone = 'text-ink' }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${tone}`}>{formatNumber(value)}</p>
    </div>
  )
}
