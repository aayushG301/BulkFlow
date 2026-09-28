export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  NEW_UPLOAD: '/uploads/new',
  JOBS: '/jobs',
  JOB_DETAILS: '/jobs/:jobId',
  RESULTS: '/results',
  RESULT_DETAILS: '/results/:resultId',
  AI_ENRICHMENT: '/ai-enrichment',
  ACCOUNT: '/account',
  SETTINGS: '/settings',
  HELP: '/help',
}

export const jobDetailsPath = (jobId) => `/jobs/${jobId}`
export const resultDetailsPath = (resultId) => `/results/${resultId}`
