import { useEffect, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'

import { resultApi } from '@/services/result.api'
import { ResultStatusBadge } from '@/components/results/ResultStatusBadge'
import { ResultDataViewer } from '@/components/results/ResultDataViewer'
import { ResultError } from '@/components/results/ResultError'
import { ResultEnrichment } from '@/components/results/ResultEnrichment'
import { Spinner } from '@/components/ui/Spinner'
import { ErrorState } from '@/components/ui/ErrorState'
import { formatDateTime } from '@/utils/formatDate'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { ROUTES } from '@/constants/routes'

export function ResultDetails() {
  const { resultId } = useParams()
  const { setPageHeader } = useOutletContext()

  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchResult = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await resultApi.getById(resultId)
      setResult(response.data.data)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, 'Could not load this row.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchResult()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultId])

  useEffect(() => {
    setPageHeader({
      breadcrumb: [
        { label: 'Results', to: ROUTES.RESULTS },
        { label: result ? `Row #${result.rowNum}` : 'Row details' },
      ],
    })
  }, [setPageHeader, result])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="p-10">
        <ErrorState description={error || 'Row not found.'} onRetry={fetchResult} />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-ink">
            Row #{String(result.rowNum).padStart(4, '0')}
          </h1>
          <ResultStatusBadge status={result.status} />
        </div>
        <p className="text-xs text-ink-faint">
          {result.processedAt ? `Processed ${formatDateTime(result.processedAt)}` : 'Not yet processed'}
        </p>
      </div>

      {result.status === 'failed' && <ResultError error={result.error} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ResultDataViewer title="Original input" data={result.originalData} />
        <ResultDataViewer title="Processed data" data={result.processedData} />
      </div>

      <ResultEnrichment enrichmentData={result.enrichmentData} resultStatus={result.status} />
    </div>
  )
}
