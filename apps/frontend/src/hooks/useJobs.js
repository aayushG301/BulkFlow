import { useCallback, useEffect, useState } from 'react'

import { jobApi } from '@/services/job.api'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { usePagination } from '@/hooks/usePagination'

const PAGE_SIZE = 10

export function useJobs({ status = '' } = {}) {
  const { page, setPage, reset } = usePagination()
  const [jobs, setJobs] = useState([])
  const [pagination, setPagination] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchJobs = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await jobApi.list({ page, pageSize: PAGE_SIZE, status })
      setJobs(response.data.data.jobs)
      setPagination(response.data.data.pagination)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Could not load jobs.'))
    } finally {
      setIsLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Changing filters should always jump back to page 1
  useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const cancelJob = useCallback(
    async (jobId) => {
      await jobApi.cancel(jobId)
      await fetchJobs()
    },
    [fetchJobs],
  )

  const retryJob = useCallback(
    async (jobId) => {
      await jobApi.retry(jobId)
      await fetchJobs()
    },
    [fetchJobs],
  )

  const deleteJob = useCallback(
    async (jobId) => {
      await jobApi.remove(jobId)
      await fetchJobs()
    },
    [fetchJobs],
  )

  return {
    jobs,
    pagination,
    page,
    setPage,
    isLoading,
    error,
    refetch: fetchJobs,
    cancelJob,
    retryJob,
    deleteJob,
  }
}
