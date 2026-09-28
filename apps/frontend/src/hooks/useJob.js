import { useCallback, useEffect, useState } from 'react'

import { jobApi } from '@/services/job.api'
import { getErrorMessage } from '@/utils/getErrorMessage'

export function useJob(jobId) {
  const [job, setJob] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchJob = useCallback(async () => {
    if (!jobId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await jobApi.getById(jobId)
      setJob(response.data.data)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Could not load this job.'))
    } finally {
      setIsLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    fetchJob()
  }, [fetchJob])

  // Merges a partial patch (e.g. from a socket event) into the current
  // job without waiting for a full refetch.
  const patchJob = useCallback((patch) => {
    setJob((current) => (current ? { ...current, ...patch } : current))
  }, [])

  return { job, setJob: patchJob, isLoading, error, refetch: fetchJob }
}
