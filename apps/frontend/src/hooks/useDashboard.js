import { useCallback, useEffect, useState } from 'react'

import { dashboardApi } from '@/services/dashboard.api'
import { getErrorMessage } from '@/utils/getErrorMessage'

const AUTOREFRESH_INTERVAL_MS = 15000

export function useDashboard() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboard = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true)
    setError(null)

    try {
      const response = await dashboardApi.get()
      setData(response.data.data)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Could not load the dashboard.'))
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()

    const interval = setInterval(() => fetchDashboard({ silent: true }), AUTOREFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  return { data, isLoading, error, refetch: fetchDashboard }
}
