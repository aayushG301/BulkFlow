import { useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'

import { useDashboard } from '@/hooks/useDashboard'
import { EnrichmentOverview } from '@/components/enrichment/EnrichmentOverview'
import { EnrichmentSettings } from '@/components/enrichment/EnrichmentSettings'
import { EnrichmentStats } from '@/components/enrichment/EnrichmentStats'
import { formatNumber } from '@/utils/formatNumber'

export function AIEnrichment() {
  const { setPageHeader } = useOutletContext()
  const { data } = useDashboard()

  useEffect(() => {
    setPageHeader({ breadcrumb: [{ label: 'AI Enrichment' }] })
  }, [setPageHeader])

  const stats = data
    ? [
        { label: 'Total jobs', value: formatNumber(data.summary.totalJobs) },
        { label: 'Total uploads', value: formatNumber(data.summary.totalUploads) },
        { label: 'Rows processed', value: formatNumber(data.processing.processedRows) },
      ]
    : []

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink">AI Enrichment</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Enrich rows with an AI provider as part of processing.
        </p>
      </div>

      {stats.length > 0 && <EnrichmentStats stats={stats} />}

      <EnrichmentOverview />
      <EnrichmentSettings />
    </div>
  )
}
