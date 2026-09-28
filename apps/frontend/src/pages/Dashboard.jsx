import { useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { CheckCircle2, ListChecks, Loader2, XCircle } from 'lucide-react'

import { useDashboard } from '@/hooks/useDashboard'
import { StatCard } from '@/components/dashboard/StatCard'
import { ProcessingOverview } from '@/components/dashboard/ProcessingOverview'
import { ProcessingChart } from '@/components/dashboard/ProcessingChart'
import { RecentJobs } from '@/components/dashboard/RecentJobs'
import { SkeletonText } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { formatNumber } from '@/utils/formatNumber'

export function Dashboard() {
  const { setPageHeader } = useOutletContext()
  const { data, isLoading, error, refetch } = useDashboard()

  useEffect(() => {
    setPageHeader({ breadcrumb: [{ label: 'Dashboard' }] })
  }, [setPageHeader])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Data Ingestion Overview</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Real-time view of your uploads, jobs, and row-level processing.
        </p>
      </div>

      {error && !data ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : isLoading && !data ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-border bg-surface p-4">
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <StatCard
              icon={ListChecks}
              label="Total Jobs"
              value={formatNumber(data.summary.totalJobs)}
            />
            <StatCard
              label="Active Jobs"
              value={formatNumber(data.summary.activeJobs)}
              tone="accent"
              live={data.summary.activeJobs > 0}
            />
            <StatCard
              icon={CheckCircle2}
              label="Completed"
              value={formatNumber(data.summary.completedJobs)}
              tone="completed"
            />
            <StatCard
              icon={XCircle}
              label="Failed"
              value={formatNumber(data.summary.failedJobs)}
              tone="failed"
            />
            <StatCard
              icon={Loader2}
              label="Total Uploads"
              value={formatNumber(data.summary.totalUploads)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ProcessingOverview processing={data.processing} />
            </div>
            <ProcessingChart processing={data.processing} />
          </div>

          <RecentJobs jobs={data.recentJobs} />
        </>
      )}
    </div>
  )
}
