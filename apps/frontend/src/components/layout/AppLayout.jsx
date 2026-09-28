import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileSidebar } from '@/components/layout/MobileSidebar'

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [pageHeader, setPageHeaderState] = useState({ breadcrumb: [], actions: null })

  // Pages call this (via useOutletContext) once per render to declare
  // their own breadcrumb trail and header actions, so Header stays a
  // dumb presentational component instead of knowing about routes.
  const setPageHeader = useCallback((next) => {
    setPageHeaderState((current) => ({ ...current, ...next }))
  }, [])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-base">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      <MobileSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          breadcrumb={pageHeader.breadcrumb}
          actions={pageHeader.actions}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ setPageHeader }} />
        </main>
      </div>
    </div>
  )
}
