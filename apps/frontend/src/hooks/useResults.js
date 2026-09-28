import { useCallback, useEffect, useState } from 'react'

import { resultApi } from '@/services/result.api'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { usePagination } from '@/hooks/usePagination'

const PAGE_SIZE = 25

export function useResults(jobId, { status = '' } = {}) {
  const { page, setPage, reset } = usePagination()
  const [results, setResults] = useState([])
  const [pagination, setPagination] = useState(null)
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchResults = useCallback(async () => {
    if (!jobId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await resultApi.listByJob(jobId, { page, pageSize: PAGE_SIZE, status })
      setResults(response.data.data.results)
      setPagination(response.data.data.pagination)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Could not load results.'))
    } finally {
      setIsLoading(false)
    }
  }, [jobId, page, status])

  const fetchStats = useCallback(async () => {
    if (!jobId) return

    try {
      const response = await resultApi.statsByJob(jobId)
      setStats(response.data.data)
    } catch {
      // Stats are supplementary - a failure here shouldn't block the table
    }
  }, [jobId])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, jobId])

  return {
    results,
    pagination,
    stats,
    page,
    setPage,
    isLoading,
    error,
    refetch: useCallback(() => {
      fetchResults()
      fetchStats()
    }, [fetchResults, fetchStats]),
  }
}
