import { api } from '@/services/api'

export const dashboardApi = {
  get: () => api.get('/dashboard'),
}
