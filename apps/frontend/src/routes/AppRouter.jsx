import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PublicRoute } from '@/routes/PublicRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { ROUTES } from '@/constants/routes'

import { Login } from '@/pages/auth/Login'
import { Register } from '@/pages/auth/Register'
import { Dashboard } from '@/pages/Dashboard'
import { NewUpload } from '@/pages/NewUpload'
import { Jobs } from '@/pages/Jobs'
import { JobDetails } from '@/pages/JobDetails'
import { Results } from '@/pages/Results'
import { ResultDetails } from '@/pages/ResultDetails'
import { AIEnrichment } from '@/pages/AIEnrichment'
import { Account } from '@/pages/Account'
import { Settings } from '@/pages/Settings'
import { Help } from '@/pages/Help'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
            <Route path={ROUTES.NEW_UPLOAD} element={<NewUpload />} />
            <Route path={ROUTES.JOBS} element={<Jobs />} />
            <Route path={ROUTES.JOB_DETAILS} element={<JobDetails />} />
            <Route path={ROUTES.RESULTS} element={<Results />} />
            <Route path={ROUTES.RESULT_DETAILS} element={<ResultDetails />} />
            <Route path={ROUTES.AI_ENRICHMENT} element={<AIEnrichment />} />
            <Route path={ROUTES.ACCOUNT} element={<Account />} />
            <Route path={ROUTES.SETTINGS} element={<Settings />} />
            <Route path={ROUTES.HELP} element={<Help />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
