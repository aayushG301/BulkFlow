import { useCallback, useEffect, useRef, useState } from 'react'

import { exportApi } from '@/services/export.api'
import { getErrorMessage } from '@/utils/getErrorMessage'

// Exports process asynchronously on the backend - once one is queued,
// poll it for a short while until it lands on completed/failed.
const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 60000

export function useExports(jobId) {
  const [exportsList, setExportsList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState(null)
  const pollTimer = useRef(null)

  const fetchExports = useCallback(async () => {
    if (!jobId) return

    setIsLoading(true)
    try {
      const response = await exportApi.listByJob(jobId)
      setExportsList(response.data.data)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Could not load exports.'))
    } finally {
      setIsLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    fetchExports()
    return () => clearTimeout(pollTimer.current)
  }, [fetchExports])

  const pollUntilSettled = useCallback(
    (exportId) => {
      const startedAt = Date.now()

      const poll = async () => {
        try {
          const response = await exportApi.getById(exportId)
          const record = response.data.data

          setExportsList((current) =>
            current.map((item) => (item._id === record._id ? record : item)),
          )

          const isSettled = ['completed', 'failed'].includes(record.status)
          if (isSettled || Date.now() - startedAt > POLL_TIMEOUT_MS) {
            setIsExporting(false)
            return
          }

          pollTimer.current = setTimeout(poll, POLL_INTERVAL_MS)
        } catch {
          setIsExporting(false)
        }
      }

      poll()
    },
    [],
  )

  const createExport = useCallback(async () => {
    setIsExporting(true)
    setError(null)

    try {
      const response = await exportApi.create(jobId)
      const record = response.data.data
      setExportsList((current) => [record, ...current])
      pollUntilSettled(record._id)
      return record
    } catch (createError) {
      setIsExporting(false)
      setError(getErrorMessage(createError, 'Could not start the export.'))
      throw createError
    }
  }, [jobId, pollUntilSettled])

  const downloadExport = useCallback(async (exportId, fileName) => {
    setIsDownloading(true)
    try {
      await exportApi.download(exportId, fileName)
    } finally {
      setIsDownloading(false)
    }
  }, [])

  return {
    exports: exportsList,
    isLoading,
    isExporting,
    isDownloading,
    error,
    createExport,
    downloadExport,
    refetch: fetchExports,
  }
}
